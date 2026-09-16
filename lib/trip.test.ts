import { describe, it, expect } from "vitest";
import { planTrip, type TripVehicle, type TripStationLite } from "@/lib/trip";
import { JO_CITIES } from "@/lib/geo";

const city = (id: string) => {
  const c = JO_CITIES.find((x) => x.id === id);
  if (!c) throw new Error(`no city ${id}`);
  return c;
};

const bigCar: TripVehicle = { usableKwh: 60, consumption: 15, dcKw: 100, connector: "CCS2" };
const smallCar: TripVehicle = { usableKwh: 40, consumption: 16, dcKw: 50, connector: "CCS2" };

describe("planTrip", () => {
  it("reaches a nearby city directly with no charging stops", () => {
    const r = planTrip({
      origin: city("amman"), destination: city("zarqa"), vehicle: bigCar,
      startSocPct: 90, arrivalTargetPct: 20, climateLoad: false, stations: [],
    });
    expect(r.feasibleDirect).toBe(true);
    expect(r.stops).toHaveLength(0);
    expect(r.distanceKm).toBeGreaterThan(0);
    expect(r.arrivalSocPct).toBeLessThan(90);
    expect(r.arrivalSocPct).toBeGreaterThanOrEqual(20);
  });

  it("raises consumption ~15% under climate load", () => {
    const base = planTrip({
      origin: city("amman"), destination: city("zarqa"), vehicle: bigCar,
      startSocPct: 90, arrivalTargetPct: 20, climateLoad: false, stations: [],
    });
    const climate = planTrip({
      origin: city("amman"), destination: city("zarqa"), vehicle: bigCar,
      startSocPct: 90, arrivalTargetPct: 20, climateLoad: true, stations: [],
    });
    expect(climate.consumptionUsed).toBeCloseTo(17.3, 5); // 15 × 1.15, rounded to 1 dp
    expect(climate.consumptionUsed).toBeGreaterThan(base.consumptionUsed);
    expect(climate.arrivalSocPct).toBeLessThan(base.arrivalSocPct);
  });

  it("marks a long trip infeasible when no stations are available", () => {
    const r = planTrip({
      origin: city("amman"), destination: city("aqaba"), vehicle: smallCar,
      startSocPct: 80, arrivalTargetPct: 15, climateLoad: false, stations: [],
    });
    expect(r.feasibleDirect).toBe(false);
    expect(r.stops).toHaveLength(0);
  });

  it("inserts a compatible fast-charging stop on a long trip", () => {
    const midStation: TripStationLite = {
      id: "test-mid", nameEn: "Mid Corridor DC", nameAr: null,
      latitude: 31.2, longitude: 35.9, maxPowerKw: 120, status: "OPERATIONAL",
      connectors: [{ type: "CCS2", powerKw: 120, quantity: 2 }],
    };
    const r = planTrip({
      origin: city("amman"), destination: city("aqaba"), vehicle: smallCar,
      startSocPct: 80, arrivalTargetPct: 15, climateLoad: false, stations: [midStation],
    });
    expect(r.feasibleDirect).toBe(false);
    expect(r.stops.length).toBeGreaterThanOrEqual(1);
    expect(r.stops[0].stationId).toBe("test-mid");
    // charge power capped by the car's DC limit (50 kW < station's 120 kW)
    expect(r.stops[0].powerKw).toBe(50);
  });

  it("skips incompatible-connector stations", () => {
    const chademoOnly: TripStationLite = {
      id: "chademo", nameEn: "CHAdeMO only", nameAr: null,
      latitude: 31.2, longitude: 35.9, maxPowerKw: 120, status: "OPERATIONAL",
      connectors: [{ type: "CHADEMO", powerKw: 120, quantity: 1 }],
    };
    const r = planTrip({
      origin: city("amman"), destination: city("aqaba"), vehicle: smallCar,
      startSocPct: 80, arrivalTargetPct: 15, climateLoad: false, stations: [chademoOnly],
    });
    expect(r.stops).toHaveLength(0); // CCS2 car can't use a CHAdeMO-only station
  });
});
