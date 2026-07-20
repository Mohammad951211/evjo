"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface AppState {
  /** Browser geolocation, once granted. */
  location: { lat: number; lng: number } | null;
  setLocation: (loc: { lat: number; lng: number } | null) => void;
  /** Selected garage vehicle id (client-side quick switch). */
  activeVehicleId: string | null;
  setActiveVehicleId: (id: string | null) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      location: null,
      setLocation: (location) => set({ location }),
      activeVehicleId: null,
      setActiveVehicleId: (activeVehicleId) => set({ activeVehicleId }),
    }),
    { name: "evjo-app" }
  )
);

/** Amman fallback center when geolocation is unavailable. */
export const DEFAULT_CENTER = { lat: 31.9539, lng: 35.9106 };
