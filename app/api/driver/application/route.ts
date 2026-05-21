import { NextResponse } from "next/server";

import { requireUser } from "@/lib/auth/session";
import {
  ApplicationBody,
  validateSubmitPayload,
} from "@/lib/driver/application-schema";
import {
  createServerSupabaseClient,
  createServiceSupabaseClient,
} from "@/lib/supabase/server";
import type { Driver } from "@/lib/supabase/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Any signed-in user can apply — including riders who don't have a
  // driver profile yet. On `submit` we'll flip their role to "driver"
  // server-side via the service-role client.
  const { profile } = await requireUser();
  if (!profile) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const parsed = ApplicationBody.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const input = parsed.data;
  const supabase = await createServerSupabaseClient();
  const service = createServiceSupabaseClient();

  const { data: existing } = await supabase
    .from("drivers")
    .select("*")
    .eq("profile_id", profile.id)
    .maybeSingle<Driver>();

  if (
    existing &&
    !["draft", "rejected"].includes(existing.approval_status)
  ) {
    return NextResponse.json(
      { error: "Application cannot be changed in the current state." },
      { status: 409 },
    );
  }

  if (input.action === "submit") {
    const validationError = validateSubmitPayload(input);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const { data: banned } = await service.rpc("check_banned_identifiers", {
      p_national_id: input.nationalId ?? "",
      p_license_number: input.licenseNumber ?? "",
    });

    if (banned) {
      return NextResponse.json(
        {
          error:
            "This national ID or license number is blocked from driver registration. Contact support if you believe this is an error.",
        },
        { status: 403 },
      );
    }
  }

  if (input.fullName || input.phone) {
    await supabase
      .from("profiles")
      .update({
        ...(input.fullName ? { full_name: input.fullName.trim() } : {}),
        ...(input.phone !== undefined ? { phone: input.phone || null } : {}),
      })
      .eq("id", profile.id);
  }

  const driverPatch: Record<string, unknown> = {
    profile_id: profile.id,
    status: "offline",
    is_verified: false,
  };

  if (input.nationalId !== undefined) driverPatch.national_id = input.nationalId;
  if (input.licenseNumber !== undefined) {
    driverPatch.license_number = input.licenseNumber;
  }
  if (input.licenseFrontPath !== undefined) {
    driverPatch.license_front_path = input.licenseFrontPath;
  }
  if (input.licenseBackPath !== undefined) {
    driverPatch.license_back_path = input.licenseBackPath;
  }
  if (input.carPhotoPaths !== undefined) {
    driverPatch.car_photo_paths = input.carPhotoPaths;
  }
  if (input.vehicleBodyType !== undefined) {
    driverPatch.vehicle_body_type = input.vehicleBodyType;
  }
  if (input.vehicleYear !== undefined) {
    driverPatch.vehicle_year = input.vehicleYear;
  }
  if (input.requestedTierId !== undefined) {
    driverPatch.requested_tier_id = input.requestedTierId;
  }

  // The INSERT RLS policy on `drivers` historically only accepted rows in
  // `approval_status = 'draft'`. To work on databases where migration
  // 0005 hasn't been applied yet, we always create the row as 'draft'
  // first (which passes RLS), then bump it to 'submitted' in a separate
  // UPDATE if the user clicked Submit. The guard_driver_self_update
  // trigger explicitly allows the draft → submitted transition.
  const isFirstSubmit = !existing && input.action === "submit";
  if (input.action === "submit" && existing) {
    driverPatch.approval_status = "submitted";
  } else if (!existing) {
    driverPatch.approval_status = "draft";
  }

  const { data: upserted, error: driverErr } = await supabase
    .from("drivers")
    .upsert(driverPatch, { onConflict: "profile_id" })
    .select("*")
    .single<Driver>();

  if (driverErr) {
    return NextResponse.json({ error: driverErr.message }, { status: 500 });
  }

  let driver: Driver = upserted;

  if (isFirstSubmit) {
    const { data: promoted, error: promoteErr } = await supabase
      .from("drivers")
      .update({ approval_status: "submitted" })
      .eq("profile_id", profile.id)
      .select("*")
      .single<Driver>();
    if (promoteErr) {
      return NextResponse.json(
        { error: promoteErr.message },
        { status: 500 },
      );
    }
    driver = promoted;
  }

  // When a rider submits the application, promote them to driver so the
  // middleware routes them through the normal pending-driver flow
  // (/driver/onboarding while submitted, /driver once approved). We
  // never auto-promote admins — they're already at a higher privilege
  // level and should keep that role.
  if (input.action === "submit" && profile.role === "rider") {
    await service
      .from("profiles")
      .update({ role: "driver" })
      .eq("id", profile.id);
  }

  if (
    input.make &&
    input.model &&
    input.plateNumber &&
    input.requestedTierId &&
    input.seats
  ) {
    const vehiclePayload = {
      driver_id: profile.id,
      tier_id: input.requestedTierId,
      make: input.make,
      model: input.model,
      plate_number: input.plateNumber.toUpperCase(),
      color: input.color ?? "",
      seats: input.seats,
    };

    if (existing?.vehicle_id) {
      await supabase
        .from("vehicles")
        .update(vehiclePayload)
        .eq("id", existing.vehicle_id);
    } else {
      const { data: vehicle, error: vehErr } = await supabase
        .from("vehicles")
        .insert(vehiclePayload)
        .select("id")
        .single();

      if (vehErr) {
        return NextResponse.json({ error: vehErr.message }, { status: 500 });
      }

      await supabase
        .from("drivers")
        .update({ vehicle_id: vehicle.id })
        .eq("profile_id", profile.id);
    }
  }

  return NextResponse.json({
    ok: true,
    driver,
    approval_status: driver.approval_status,
  });
}
