import { randomUUID } from "node:crypto";
import type {
  CreateIntentArgs,
  CreateIntentResult,
  PaymentProvider,
} from "./provider";

/**
 * In-memory mock provider. Useful in dev so the full ride flow works without
 * Stripe credentials. Treats every charge as instantly paid.
 */
export class MockPaymentProvider implements PaymentProvider {
  readonly id = "mock";

  async createIntent(_args: CreateIntentArgs): Promise<CreateIntentResult> {
    return {
      intentId: `mock_${randomUUID()}`,
      status: "paid",
    };
  }
}
