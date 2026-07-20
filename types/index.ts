import type { TouPeriod } from "@/config/tariffs";

export interface VehicleSpec {
  id: string;
  make: string;
  model: string;
  variant: string;
  yearFrom: number;
  yearTo: number | null;
  batteryKwh: number;
  usableKwh: number;
  rangeKm: number;
  consumption: number;
  acKw: number;
  dcKw: number;
  connector: "CCS2" | "CHADEMO" | "GBT_DC" | "TYPE2";
  weightKg: number | null;
  drivetrain: string | null;
  image: string | null;
}

export interface GarageVehicle {
  id: string;
  nickname: string | null;
  year: number | null;
  isDefault: boolean;
  spec: {
    name: string;
    make: string;
    batteryKwh: number;
    usableKwh: number;
    rangeKm: number | null;
    consumption: number;
    dcKw: number;
    acKw: number | null;
    connector: string;
    image: string | null;
  };
}

export interface StationDto {
  id: string;
  ocmId: number | null;
  nameEn: string;
  nameAr: string | null;
  operator: string | null;
  latitude: number;
  longitude: number;
  address: string | null;
  town: string | null;
  status: string;
  connectors: { type: string; powerKw: number; quantity: number }[];
  maxPowerKw: number;
  totalPoints: number;
  source?: string;
  pricing: string | null;
  distanceKm?: number;
  driveMin?: number;
}

export interface SessionDto {
  id: string;
  locationType: "STATION" | "HOME";
  stationName: string | null;
  vehicleName: string | null;
  startedAt: string;
  kwh: number;
  costJod: number;
  durationMin: number | null;
}

export interface TariffNow {
  period: TouPeriod;
  rate: number;
  validUntil: string;
}

export interface TripStop {
  stationId: string;
  name: string;
  detourKm: number;
  arrivalSocPct: number;
  chargeToPct: number;
  kwhAdded: number;
  chargeMin: number;
  costJod: number;
  powerKw: number;
}

export interface TripPlan {
  distanceKm: number;
  energyKwh: number;
  consumptionUsed: number;
  startSocPct: number;
  arrivalSocPct: number;
  feasibleDirect: boolean;
  stops: TripStop[];
  waypoints: { label: string; socPct: number; km: number }[];
}
