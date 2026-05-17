import type { PaymentProvider } from "./provider";
import { MockPaymentProvider } from "./mock";
import { StripePaymentProvider } from "./stripe";

let _provider: PaymentProvider | null = null;

export function getPaymentProvider(): PaymentProvider {
  if (_provider) return _provider;
  const id = (process.env.PAYMENT_PROVIDER ?? "mock").toLowerCase();
  switch (id) {
    case "stripe":
      _provider = new StripePaymentProvider();
      break;
    case "mock":
    default:
      _provider = new MockPaymentProvider();
      break;
  }
  return _provider;
}

export type { PaymentProvider } from "./provider";
