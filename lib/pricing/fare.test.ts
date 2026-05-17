import { describe, expect, it } from "vitest";
import { quoteFare, parseLatLng } from "./fare";

const standard = {
  base_fare_minor: 1500,
  per_km_minor: 600,
  per_minute_minor: 120,
  min_fare_minor: 2500,
  currency: "MWK",
  surge_multiplier: 1,
};

describe("quoteFare", () => {
  it("computes base + per-km + per-minute", () => {
    const fare = quoteFare({
      tier: standard,
      distanceKm: 10,
      durationMin: 20,
    });
    // 1500 + 6000 + 2400 = 9900, surge 1x
    expect(fare.distance_minor).toBe(6000);
    expect(fare.time_minor).toBe(2400);
    expect(fare.subtotal_minor).toBe(9900);
    expect(fare.total_minor).toBe(9900);
    expect(fare.min_fare_applied).toBe(false);
    expect(fare.currency).toBe("MWK");
  });

  it("applies a minimum fare floor", () => {
    const fare = quoteFare({
      tier: standard,
      distanceKm: 0.5,
      durationMin: 1,
    });
    // 1500 + 300 + 120 = 1920 -> floor to 2500
    expect(fare.subtotal_minor).toBe(1920);
    expect(fare.total_minor).toBe(2500);
    expect(fare.min_fare_applied).toBe(true);
  });

  it("applies a surge multiplier", () => {
    const fare = quoteFare({
      tier: standard,
      distanceKm: 10,
      durationMin: 20,
      surge: 1.5,
    });
    // 9900 * 1.5 = 14850
    expect(fare.subtotal_minor).toBe(14850);
    expect(fare.total_minor).toBe(14850);
    expect(fare.surge).toBe(1.5);
  });

  it("clamps negative inputs to zero", () => {
    const fare = quoteFare({
      tier: standard,
      distanceKm: -3,
      durationMin: -5,
    });
    expect(fare.distance_minor).toBe(0);
    expect(fare.time_minor).toBe(0);
    expect(fare.total_minor).toBe(2500);
  });
});

describe("parseLatLng", () => {
  it("parses a coordinate pair", () => {
    expect(parseLatLng("-13.96,33.77")).toEqual({ lat: -13.96, lng: 33.77 });
  });
  it("rejects out-of-range values", () => {
    expect(parseLatLng("100,400")).toBeNull();
  });
  it("rejects malformed input", () => {
    expect(parseLatLng("hello")).toBeNull();
  });
});
