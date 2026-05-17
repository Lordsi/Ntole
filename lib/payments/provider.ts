/**
 * Payment provider interface.
 *
 * The app charges the rider for a completed ride via this interface. We ship
 * two implementations:
 *   - MockProvider: instantly marks payments as paid. Default for development.
 *   - StripeProvider: creates a Stripe Payment Intent. Webhook flips status.
 *
 * To plug in PayChangu, Airtel Money, or another provider, implement this
 * interface and register it in `lib/payments/index.ts`.
 */

export interface CreateIntentArgs {
  rideId: string;
  riderId: string;
  amountMinor: number;
  currency: string;
  /** Optional metadata forwarded to the provider. */
  metadata?: Record<string, string>;
}

export interface CreateIntentResult {
  /** Provider-side identifier used to look up or update the intent later. */
  intentId: string;
  /** Initial status. Stripe is "pending" until the webhook arrives. */
  status: "pending" | "authorized" | "paid" | "failed";
  /** Optional client secret for client-side confirmation. */
  clientSecret?: string;
}

export interface PaymentProvider {
  readonly id: string;
  createIntent(args: CreateIntentArgs): Promise<CreateIntentResult>;
}
