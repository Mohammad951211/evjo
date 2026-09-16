-- Add indexes on foreign-key columns that had none. Postgres does not auto-index
-- FKs, so joins, cascade deletes, and "does this parent have children?" checks
-- (e.g. deleting a Vehicle referenced by UserVehicle) were doing sequential scans.

-- CreateIndex
CREATE INDEX "UserVehicle_vehicleId_idx" ON "UserVehicle"("vehicleId");

-- CreateIndex
CREATE INDEX "PasswordResetRequest_userId_idx" ON "PasswordResetRequest"("userId");

-- CreateIndex
CREATE INDEX "StationReport_userId_idx" ON "StationReport"("userId");

-- CreateIndex
CREATE INDEX "ChargingSession_userVehicleId_idx" ON "ChargingSession"("userVehicleId");

-- CreateIndex
CREATE INDEX "ChargingSession_stationId_idx" ON "ChargingSession"("stationId");
