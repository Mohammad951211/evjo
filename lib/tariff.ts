import {
  TOU_WINDOWS,
  STATION_RATES,
  HOME_EV_METER_RATES,
  HOME_SERVICES_TIERS,
  type TouPeriod,
} from "@/config/tariffs";

export type RateContext =
  | { location: "station" }
  | { location: "home"; meterType: "EV_METER" }
  | { location: "home"; meterType: "SERVICES_METER"; tier: number };

export function periodAt(date: Date): TouPeriod {
  const h = date.getHours();
  for (const w of TOU_WINDOWS) {
    if (h >= w.from && h < w.to) return w.period;
  }
  return "partial";
}

/** Returns the Date at which the current TOU period ends. */
export function periodEndsAt(date: Date): Date {
  const current = periodAt(date);
  const d = new Date(date);
  d.setMinutes(0, 0, 0);
  for (let i = 1; i <= 24; i++) {
    const probe = new Date(d.getTime() + i * 3600_000);
    if (periodAt(probe) !== current) return probe;
  }
  return new Date(d.getTime() + 24 * 3600_000);
}

export function rateFor(ctx: RateContext, period: TouPeriod): number {
  if (ctx.location === "station") return STATION_RATES[period];
  if (ctx.meterType === "EV_METER") return HOME_EV_METER_RATES[period];
  const t = HOME_SERVICES_TIERS.find((x) => x.tier === ctx.tier);
  return (t ?? HOME_SERVICES_TIERS[1]).rate;
}

export interface CostSegment {
  period: TouPeriod;
  from: Date;
  to: Date;
  kwh: number;
  rate: number;
  cost: number;
}

export interface ChargeCostResult {
  kwh: number;
  durationMin: number;
  totalCost: number;
  segments: CostSegment[];
  endsAt: Date;
}

/**
 * Splits a charging session across TOU boundaries: walks hour-fraction
 * slices from `start`, charging at `powerKw`, pricing each slice at the
 * rate of its period. Services-meter rates are flat, so the split still
 * works (all segments share one rate).
 */
export function computeChargeCost(opts: {
  kwhNeeded: number;
  powerKw: number;
  start: Date;
  ctx: RateContext;
}): ChargeCostResult {
  const { kwhNeeded, powerKw, start, ctx } = opts;
  const segments: CostSegment[] = [];
  let remaining = Math.max(0, kwhNeeded);
  let cursor = new Date(start);
  let totalCost = 0;
  let guard = 0;

  while (remaining > 0.0001 && guard++ < 500) {
    const period = periodAt(cursor);
    const boundary = periodEndsAt(cursor);
    const hoursToBoundary = (boundary.getTime() - cursor.getTime()) / 3600_000;
    const kwhToBoundary = powerKw * hoursToBoundary;
    const kwhHere = Math.min(remaining, kwhToBoundary);
    const hoursHere = kwhHere / powerKw;
    const segEnd = new Date(cursor.getTime() + hoursHere * 3600_000);
    const rate = rateFor(ctx, period);
    const cost = kwhHere * rate;

    const last = segments[segments.length - 1];
    if (last && last.period === period && last.rate === rate) {
      last.to = segEnd;
      last.kwh += kwhHere;
      last.cost += cost;
    } else {
      segments.push({ period, from: new Date(cursor), to: segEnd, kwh: kwhHere, rate, cost });
    }

    totalCost += cost;
    remaining -= kwhHere;
    cursor = segEnd;
  }

  const durationMin = Math.round(((cursor.getTime() - start.getTime()) / 60_000) * 10) / 10;
  return {
    kwh: kwhNeeded,
    durationMin: Math.round(durationMin),
    totalCost: Math.round(totalCost * 1000) / 1000,
    segments,
    endsAt: cursor,
  };
}
