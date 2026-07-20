import { haversineKm, roadKm, driveMinutes, type JoCity } from "@/lib/geo";
import { computeChargeCost } from "@/lib/tariff";
import type { TripPlan, TripStop } from "@/types";

export interface TripVehicle {
  usableKwh: number;
  consumption: number; // kWh/100km
  dcKw: number;
  connector: string;
}

export interface TripStationLite {
  id: string;
  nameEn: string;
  nameAr: string | null;
  latitude: number;
  longitude: number;
  maxPowerKw: number;
  status: string;
  connectors: { type: string; powerKw: number; quantity: number }[];
}

/**
 * Greedy corridor planner: walk the straight route origin→destination;
 * when charge would drop below reserve, insert the best compatible fast
 * station near the current corridor position, charge to 90%, continue.
 */
export function planTrip(opts: {
  origin: JoCity;
  destination: JoCity;
  vehicle: TripVehicle;
  startSocPct: number;
  arrivalTargetPct: number;
  climateLoad: boolean;
  stations: TripStationLite[];
  startTime?: Date;
  localeAr?: boolean;
}): TripPlan {
  const { origin, destination, vehicle, startSocPct, arrivalTargetPct, climateLoad, stations } = opts;
  const consumption = vehicle.consumption * (climateLoad ? 1.15 : 1);
  const distanceKm = roadKm(haversineKm(origin.lat, origin.lng, destination.lat, destination.lng));
  const energyKwh = (distanceKm / 100) * consumption;

  const kwhPerPct = vehicle.usableKwh / 100;
  const neededPct = (energyKwh / vehicle.usableKwh) * 100;
  const arrivalDirect = startSocPct - neededPct;
  const feasibleDirect = arrivalDirect >= arrivalTargetPct;

  const waypoints: TripPlan["waypoints"] = [
    { label: origin.nameEn, socPct: Math.round(startSocPct), km: 0 },
  ];
  const stops: TripStop[] = [];

  if (feasibleDirect) {
    waypoints.push({
      label: destination.nameEn,
      socPct: Math.round(arrivalDirect),
      km: Math.round(distanceKm),
    });
    return {
      distanceKm: Math.round(distanceKm * 10) / 10,
      energyKwh: Math.round(energyKwh * 10) / 10,
      consumptionUsed: Math.round(consumption * 10) / 10,
      startSocPct,
      arrivalSocPct: Math.round(arrivalDirect),
      feasibleDirect: true,
      stops: [],
      waypoints,
    };
  }

  // usable compatible stations, projected onto the corridor
  const compat = stations.filter(
    (s) =>
      s.status !== "OFFLINE" &&
      s.connectors.some((c) => c.type === vehicle.connector && c.powerKw >= 50)
  );

  let posLat = origin.lat;
  let posLng = origin.lng;
  let soc = startSocPct;
  let travelled = 0;
  let now = opts.startTime ?? new Date();
  const CHARGE_TO = 90;
  const RESERVE = Math.max(10, arrivalTargetPct);
  let guard = 0;

  while (guard++ < 6) {
    const remainKm = roadKm(haversineKm(posLat, posLng, destination.lat, destination.lng));
    const remainPct = ((remainKm / 100) * consumption) / kwhPerPct;
    if (soc - remainPct >= arrivalTargetPct) {
      travelled += remainKm;
      waypoints.push({
        label: destination.nameEn,
        socPct: Math.round(soc - remainPct),
        km: Math.round(travelled),
      });
      return {
        distanceKm: Math.round((travelled) * 10) / 10,
        energyKwh: Math.round(((travelled / 100) * consumption) * 10) / 10,
        consumptionUsed: Math.round(consumption * 10) / 10,
        startSocPct,
        arrivalSocPct: Math.round(soc - remainPct),
        feasibleDirect: false,
        stops,
        waypoints,
      };
    }

    // how far can we go before hitting reserve?
    const reachKm = Math.max(0, ((soc - RESERVE) * kwhPerPct * 100) / consumption);

    // candidate stations reachable now, scored by progress toward destination
    const candidates = compat
      .map((s) => {
        const dTo = roadKm(haversineKm(posLat, posLng, s.latitude, s.longitude));
        const dFrom = roadKm(haversineKm(s.latitude, s.longitude, destination.lat, destination.lng));
        const detour = dTo + dFrom - remainKm;
        return { s, dTo, dFrom, detour };
      })
      .filter((c) => c.dTo <= reachKm && c.dTo > 1 && !stops.some((st) => st.stationId === c.s.id))
      .sort((a, b) => a.dFrom - b.dFrom);

    const pick = candidates[0];
    if (!pick) {
      // cannot reach any further station — report infeasible tail
      waypoints.push({
        label: destination.nameEn,
        socPct: Math.round(soc - remainPct),
        km: Math.round(travelled + remainKm),
      });
      return {
        distanceKm: Math.round((travelled + remainKm) * 10) / 10,
        energyKwh: Math.round((((travelled + remainKm) / 100) * consumption) * 10) / 10,
        consumptionUsed: Math.round(consumption * 10) / 10,
        startSocPct,
        arrivalSocPct: Math.round(soc - remainPct),
        feasibleDirect: false,
        stops,
        waypoints,
      };
    }

    // drive to the station
    const usedPct = ((pick.dTo / 100) * consumption) / kwhPerPct;
    soc -= usedPct;
    travelled += pick.dTo;
    now = new Date(now.getTime() + driveMinutes(pick.dTo) * 60_000);

    // charge to 90%
    const stationPower = Math.max(
      ...pick.s.connectors
        .filter((c) => c.type === vehicle.connector)
        .map((c) => c.powerKw)
    );
    const powerKw = Math.min(stationPower, vehicle.dcKw);
    const kwhAdded = Math.max(0, (CHARGE_TO - soc) * kwhPerPct);
    const charge = computeChargeCost({
      kwhNeeded: kwhAdded,
      powerKw,
      start: now,
      ctx: { location: "station" },
    });

    stops.push({
      stationId: pick.s.id,
      name: opts.localeAr && pick.s.nameAr ? pick.s.nameAr : pick.s.nameEn,
      detourKm: Math.round(Math.max(0, pick.detour) * 10) / 10,
      arrivalSocPct: Math.round(soc),
      chargeToPct: CHARGE_TO,
      kwhAdded: Math.round(kwhAdded * 10) / 10,
      chargeMin: charge.durationMin,
      costJod: charge.totalCost,
      powerKw,
    });
    waypoints.push({
      label: opts.localeAr && pick.s.nameAr ? pick.s.nameAr : pick.s.nameEn,
      socPct: Math.round(soc),
      km: Math.round(travelled),
    });

    soc = CHARGE_TO;
    now = charge.endsAt;
    posLat = pick.s.latitude;
    posLng = pick.s.longitude;
  }

  return {
    distanceKm: Math.round(distanceKm * 10) / 10,
    energyKwh: Math.round(energyKwh * 10) / 10,
    consumptionUsed: Math.round(consumption * 10) / 10,
    startSocPct,
    arrivalSocPct: 0,
    feasibleDirect: false,
    stops,
    waypoints,
  };
}
