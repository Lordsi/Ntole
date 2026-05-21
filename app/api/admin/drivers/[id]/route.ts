import { NextResponse } from "next/server";
import { z } from "zod";

import { logModerationEvent, upsertBannedIdentifiers } from "@/lib/admin/driver-moderation";
import { requireRole } from "@/lib/auth/session";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase/server";
import type { Driver } from "@/lib/supabase/types";

export const runtime = "nodejs";

const PatchBody = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("approve"),
    tierId: z.string().uuid(),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("reject"),
    reason: z.string().min(3),
  }),
  z.object({
    action: z.literal("warn"),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("ban"),
    reason: z.string().min(3),
  }),
  z.object({
    action: z.literal("unban"),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("set_tier"),
    tierId: z.string().uuid(),
  }),
  z.object({
    action: z.literal("set_rating"),
    rating: z.number().min(1).max(5),
    notes: z.string().optional(),
  }),
  z.object({
    action: z.literal("verify"),
  }),
]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: driverId } = await params;
  const { profile: admin } = await requireRole("admin");
  const body = PatchBody.safeParse(await request.json().catch(() => null));
  if (!body.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const supabase = await createServerSupabaseClient();
  const service = createServiceSupabaseClient();

  const { data: driver, error: driverErr } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", driverId)
    .maybeSingle<Driver>();

  if (driverErr || !driver) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  const action = body.data;

  switch (action.action) {
    case "approve": {
      let vehicleId = driver.vehicle_id;
      if (!vehicleId) {
        const { data: veh } = await supabase
          .from("vehicles")
          .select("id")
          .eq("driver_id", driverId)
          .maybeSingle();
        vehicleId = veh?.id ?? null;
      }
      if (vehicleId) {
        await supabase
          .from("vehicles")
          .update({ tier_id: action.tierId })
          .eq("id", vehicleId);
      }
      await supabase
        .from("drivers")
        .update({
          approval_status: "approved",
          is_verified: true,
          admin_assigned_tier_id: action.tierId,
          vehicle_id: vehicleId,
          status: "offline",
          rejection_reason: null,
        })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "approve",
        notes: action.notes,
        payload: { tierId: action.tierId },
      });
      break;
    }
    case "reject": {
      await supabase
        .from("drivers")
        .update({
          approval_status: "rejected",
          is_verified: false,
          status: "offline",
          rejection_reason: action.reason,
        })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "reject",
        notes: action.reason,
      });
      break;
    }
    case "warn": {
      await supabase
        .from("drivers")
        .update({ warning_count: driver.warning_count + 1 })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "warn",
        notes: action.notes,
        payload: { warning_count: driver.warning_count + 1 },
      });
      break;
    }
    case "ban": {
      await supabase
        .from("drivers")
        .update({
          approval_status: "banned",
          is_verified: false,
          status: "offline",
          banned_at: new Date().toISOString(),
          ban_reason: action.reason,
        })
        .eq("profile_id", driverId);

      await upsertBannedIdentifiers(service, {
        profileId: driverId,
        adminId: admin!.id,
        nationalId: driver.national_id,
        licenseNumber: driver.license_number,
        reason: action.reason,
      });

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "ban",
        notes: action.reason,
      });
      break;
    }
    case "unban": {
      await supabase
        .from("drivers")
        .update({
          approval_status: "draft",
          banned_at: null,
          ban_reason: null,
          status: "offline",
        })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "unban",
        notes: action.notes,
      });
      break;
    }
    case "set_tier": {
      if (driver.vehicle_id) {
        await supabase
          .from("vehicles")
          .update({ tier_id: action.tierId })
          .eq("id", driver.vehicle_id);
      }
      await supabase
        .from("drivers")
        .update({ admin_assigned_tier_id: action.tierId })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "set_tier",
        payload: { tierId: action.tierId },
      });
      break;
    }
    case "set_rating": {
      await supabase
        .from("drivers")
        .update({
          rating_override: action.rating,
          rating_override_by: admin!.id,
          rating_override_at: new Date().toISOString(),
        })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "set_rating",
        notes: action.notes,
        payload: { rating: action.rating },
      });
      break;
    }
    case "verify": {
      await supabase
        .from("drivers")
        .update({ is_verified: true })
        .eq("profile_id", driverId);

      await logModerationEvent(supabase, {
        driverId,
        adminId: admin!.id,
        action: "verify",
      });
      break;
    }
  }

  const { data: updated } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", driverId)
    .single();

  return NextResponse.json({ ok: true, driver: updated });
}
