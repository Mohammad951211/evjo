import { describe, it, expect } from "vitest";
import { periodAt, rateFor, computeChargeCost } from "@/lib/tariff";

const at = (hour: number, min = 0) => new Date(2026, 0, 1, hour, min, 0, 0);

describe("periodAt", () => {
  it("maps each hour to its time-of-use window", () => {
    expect(periodAt(at(6))).toBe("offpeak"); // 05–14
    expect(periodAt(at(15))).toBe("partial"); // 14–17
    expect(periodAt(at(19))).toBe("peak"); // 17–23
    expect(periodAt(at(23, 30))).toBe("partial"); // 23–05
    expect(periodAt(at(2))).toBe("partial"); // 00–05
  });

  it("uses inclusive-start, exclusive-end boundaries", () => {
    expect(periodAt(at(5))).toBe("offpeak"); // 05:00 starts off-peak
    expect(periodAt(at(14))).toBe("partial"); // 14:00 leaves off-peak
    expect(periodAt(at(17))).toBe("peak"); // 17:00 starts peak
  });
});

describe("rateFor", () => {
  it("returns public station rates", () => {
    expect(rateFor({ location: "station" }, "offpeak")).toBeCloseTo(0.183);
    expect(rateFor({ location: "station" }, "peak")).toBeCloseTo(0.213);
  });

  it("returns home dedicated-EV-meter rates", () => {
    expect(rateFor({ location: "home", meterType: "EV_METER" }, "offpeak")).toBeCloseTo(0.108);
    expect(rateFor({ location: "home", meterType: "EV_METER" }, "peak")).toBeCloseTo(0.16);
  });

  it("returns flat services-meter tier rates", () => {
    expect(rateFor({ location: "home", meterType: "SERVICES_METER", tier: 1 }, "peak")).toBeCloseTo(0.05);
    expect(rateFor({ location: "home", meterType: "SERVICES_METER", tier: 3 }, "offpeak")).toBeCloseTo(0.2);
  });
});

describe("computeChargeCost", () => {
  it("prices a charge that stays within one period", () => {
    const r = computeChargeCost({ kwhNeeded: 10, powerKw: 10, start: at(6), ctx: { location: "station" } });
    expect(r.segments).toHaveLength(1);
    expect(r.segments[0].period).toBe("offpeak");
    expect(r.durationMin).toBe(60);
    expect(r.totalCost).toBeCloseTo(1.83, 3); // 10 kWh × 0.183
  });

  it("splits a charge across a period boundary and sums each part", () => {
    // 10 kWh at 10 kW = 1h, 13:30 → 14:30 crosses off-peak → partial at 14:00
    const r = computeChargeCost({ kwhNeeded: 10, powerKw: 10, start: at(13, 30), ctx: { location: "station" } });
    expect(r.segments).toHaveLength(2);
    expect(r.segments[0].period).toBe("offpeak");
    expect(r.segments[1].period).toBe("partial");
    // 5 kWh × 0.183 + 5 kWh × 0.193
    expect(r.totalCost).toBeCloseTo(0.915 + 0.965, 3);
  });

  it("applies home meter rates", () => {
    const r = computeChargeCost({ kwhNeeded: 10, powerKw: 10, start: at(6), ctx: { location: "home", meterType: "EV_METER" } });
    expect(r.totalCost).toBeCloseTo(1.08, 3); // 10 × 0.108
  });
});
