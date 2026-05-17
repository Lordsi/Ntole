import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { constructStripeWebhookEvent } from "@/lib/payments/stripe";
import { createServiceSupabaseClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Stripe needs the raw body to verify the signature.
export const dynamic = "force-dynamic";

const STATUS_MAP: Record<string, string> = {
  "payment_intent.succeeded": "paid",
  "payment_intent.payment_failed": "failed",
  "payment_intent.canceled": "failed",
  "payment_intent.requires_action": "authorized",
};

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }
  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = constructStripeWebhookEvent(payload, signature);
  } catch (err) {
    return NextResponse.json(
      { error: `Invalid signature: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  const target = STATUS_MAP[event.type];
  if (!target) return NextResponse.json({ ok: true });

  const intent = event.data.object as Stripe.PaymentIntent;
  const supabase = createServiceSupabaseClient();
  await supabase
    .from("payments")
    .update({ status: target })
    .eq("provider_intent_id", intent.id);

  return NextResponse.json({ ok: true });
}
