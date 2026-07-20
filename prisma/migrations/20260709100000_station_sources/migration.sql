-- Add multi-source support to stations (OpenChargeMap + OpenStreetMap)
ALTER TABLE "Station" ADD COLUMN "osmId" TEXT;
ALTER TABLE "Station" ADD COLUMN "source" TEXT NOT NULL DEFAULT 'OCM';

CREATE UNIQUE INDEX "Station_osmId_key" ON "Station"("osmId");
