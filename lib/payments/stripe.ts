import Stripe from "stripe";
import type {
  CreateIntentArgs,
  CreateIntentResult,
  PaymentProvider,
} from "./provider";

let _stripe: Stripe | null = null;
function stripe(): Stripe {
  if (_stripe) return _stripe;
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  _stripe = new Stripe(secret);
  return _stripe;
}

/**
 * Stripe Payment Intent provider. Charges happen via Stripe, and the
 * webhook handler at /api/payments/webhook flips the payment status to
 * paid when Stripe confirms the intent.
 *
 * NOTE on Malawi: Stripe currently has limited merchant onboarding for
 * Malawi-based businesses. If your live account is rejected, swap this
 * provider for PayChangu / Airtel Money by implementing PaymentProvider.
 */
export class StripePaymentProvider implements PaymentProvider {
  readonly id = "stripe";

  async createIntent(args: CreateIntentArgs): Promise<CreateIntentResult> {
    const intent = await stripe().paymentIntents.create({
      amount: args.amountMinor,
      currency: args.currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: {
        rideId: args.rideId,
        riderId: args.riderId,
        ...(args.metadata ?? {}),
      },
    });
    return {
      intentId: intent.id,
      status: "pending",
      clientSecret: intent.client_secret ?? undefined,
    };
  }
}

export function constructStripeWebhookEvent(
  payload: string,
  signature: string,
): Stripe.Event {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET is not set");
  return stripe().webhooks.constructEvent(payload, signature, secret);
}
