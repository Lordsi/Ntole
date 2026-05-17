import { NextResponse } from "next/server";
import { z } from "zod";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getPaymentProvider } from "@/lib/payments";
import type { Ride } from "@/lib/supabase/types";

export const runtime = "nodejs";

const Body = z.object({ rideId: z.string().uuid() });

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = Body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { data: ride, error } = await supabase
    .from("rides")
    .select("*")
    .eq("id", parsed.data.rideId)
    .maybeSingle<Ride>();
  if (error || !ride) {
    return NextResponse.json({ error: "Ride not found" }, { status: 404 });
  }
  if (ride.rider_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Reuse an existing payment row if one was already created for this ride.
  const { data: existing } = await supabase
    .from("payments")
    .select("*")
    .eq("ride_id", ride.id)
    .maybeSingle();
  if (existing) {
    return NextResponse.json({
      paymentId: existing.id,
      intentId: existing.provider_intent_id,
      status: existing.status,
    });
  }

  const provider = getPaymentProvider();
  const intent = await provider.createIntent({
    rideId: ride.id,
    riderId: ride.rider_id,
    amountMinor: ride.fare_minor,
    currency: ride.currency,
  });

  const { data: payment, error: insertError } = await supabase
    .from("payments")
    .insert({
      ride_id: ride.id,
      rider_id: ride.rider_id,
      provider: provider.id,
      provider_intent_id: intent.intentId,
      amount_minor: ride.fare_minor,
      currency: ride.currency,
      status: intent.status === "paid" ? "paid" : "pending",
    })
    .select("*")
    .single();
  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({
    paymentId: payment.id,
    intentId: intent.intentId,
    status: payment.status,
    clientSecret: intent.clientSecret,
  });
}
