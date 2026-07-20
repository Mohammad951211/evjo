/**
 * Jordan time-of-use electricity tariffs for EV charging.
 * All rates in JOD per kWh. Edit here when regulated rates change —
 * every calculator, card and API reads from this file.
 */

export type TouPeriod = "offpeak" | "partial" | "peak";

/** Time-of-use windows, 24h clock, [startHour, endHour) local time. */
export const TOU_WINDOWS: { period: TouPeriod; from: number; to: number }[] = [
  { period: "offpeak", from: 5, to: 14 },
  { period: "partial", from: 14, to: 17 },
  { period: "peak", from: 17, to: 23 },
  { period: "partial", from: 23, to: 24 },
  { period: "partial", from: 0, to: 5 },
];

/** Public DC fast-charging station rates. */
export const STATION_RATES: Record<TouPeriod, number> = {
  offpeak: 0.183,
  partial: 0.193,
  peak: 0.213,
};

/** Home charging on a dedicated EV meter (عداد شحن منفصل). */
export const HOME_EV_METER_RATES: Record<TouPeriod, number> = {
  offpeak: 0.108,
  partial: 0.118,
  peak: 0.16,
};

/** Home charging on the household services meter (عداد خدمات) — tiered, flat per tier. */
export const HOME_SERVICES_TIERS: { tier: number; rate: number }[] = [
  { tier: 1, rate: 0.05 },
  { tier: 2, rate: 0.1 },
  { tier: 3, rate: 0.2 },
];

/** Home charger power options (kW). */
export const HOME_CHARGER_KW = [2.3, 3.7, 7.4, 11] as const;

/** Defaults for the petrol comparison. */
export const PETROL_PRICE_JOD_PER_L = 0.9;
export const ICE_CONSUMPTION_L_PER_100KM = 8;
