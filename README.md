# EV.JO — Always Connected, Always Charged ⚡

EV companion web app for the Jordanian market: DC fast-charging station map, time-of-use charging cost calculator, trip planner, garage, and charging history. Arabic (RTL, default) + English.

## Stack

Next.js 14 (App Router) · TypeScript · Tailwind CSS · Prisma + PostgreSQL · NextAuth.js (credentials) · Zustand · Leaflet · deploy-ready on Vercel.

## Quick start

```bash
# 1. Install
npm install

# 2. Start PostgreSQL (Docker) — or point DATABASE_URL at your own instance
docker compose up -d

# 3. Configure environment
cp .env.example .env   # then edit values (OCM_API_KEY recommended)

# 4. Create schema + seed vehicles & stations
npx prisma migrate dev --name init
npx prisma db seed

# 5. Run
npm run dev            # http://localhost:3000
```

The seed imports Jordan's DC fast stations (≥ 50 kW) live from OpenChargeMap; if the API is unreachable it falls back to a curated list of known Jordanian fast chargers so the app is never empty.

## Environment variables

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | NextAuth JWT secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | App origin (e.g. `http://localhost:3000`) |
| `OCM_API_KEY` | OpenChargeMap API key (station import/refresh) |
| `MAP_API_KEY` | Optional — Mapbox/MapTiler tiles; OSM tiles used otherwise |

## Architecture notes

- **Tariffs** — all time-of-use windows and JOD/kWh rates live in [config/tariffs.ts](config/tariffs.ts). The cost engine ([lib/tariff.ts](lib/tariff.ts)) splits sessions that cross period boundaries and prices each slice at its own rate.
- **Stations** — cached in the `Station` table; `/api/stations` refreshes opportunistically when the cache is older than 24 h, and `vercel.json` schedules a daily cron hit on `/api/stations/refresh`. Only stations with at least one DC connector ≥ 50 kW (CCS2 / CHAdeMO / GB/T DC) are kept.
- **Vehicle catalog** — ~140 battery variants across 40 makes seeded from [prisma/vehicle-data.ts](prisma/vehicle-data.ts). Specs follow manufacturer data sheets (WLTP where published; CLTC-derived estimates for China-market models are labelled). An "Other / Not Listed" path lets users enter custom specs.
- **Trip planner** — greedy corridor algorithm over the cached station set: drives until reserve, inserts the compatible fast stop that makes the most progress, charges to 90%, repeats.
- **i18n** — Arabic-first dictionaries in `lib/i18n/`, locale persisted in a cookie, `dir` set server-side to avoid RTL flash.

## Deploying to Vercel

1. Create a Postgres database (Vercel Postgres / Neon / Supabase) and set `DATABASE_URL`.
2. Set `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `OCM_API_KEY`.
3. `npx prisma migrate deploy && npx prisma db seed` against the production DB.
4. Push — the included `vercel.json` registers the daily station-refresh cron.

---

Developed by [Eng. Mohammad Alghweri](https://malghweri.site/)
