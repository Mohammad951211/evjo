-- CreateEnum
CREATE TYPE "ConnectorType" AS ENUM ('CCS2', 'CHADEMO', 'GBT_DC', 'TYPE2');

-- CreateEnum
CREATE TYPE "MeterType" AS ENUM ('EV_METER', 'SERVICES_METER');

-- CreateEnum
CREATE TYPE "SessionLocation" AS ENUM ('STATION', 'HOME');

-- CreateEnum
CREATE TYPE "StationStatus" AS ENUM ('OPERATIONAL', 'PLANNED', 'UNKNOWN', 'OFFLINE');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "city" TEXT,
    "locale" TEXT NOT NULL DEFAULT 'ar',
    "onboarded" BOOLEAN NOT NULL DEFAULT false,
    "meterType" "MeterType",
    "homeChargerKw" DOUBLE PRECISION,
    "servicesTier" INTEGER DEFAULT 2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "variant" TEXT NOT NULL,
    "yearFrom" INTEGER NOT NULL,
    "yearTo" INTEGER,
    "batteryKwh" DOUBLE PRECISION NOT NULL,
    "usableKwh" DOUBLE PRECISION NOT NULL,
    "rangeKm" INTEGER NOT NULL,
    "consumption" DOUBLE PRECISION NOT NULL,
    "acKw" DOUBLE PRECISION NOT NULL,
    "dcKw" DOUBLE PRECISION NOT NULL,
    "connector" "ConnectorType" NOT NULL,
    "weightKg" INTEGER,
    "drivetrain" TEXT,
    "image" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserVehicle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vehicleId" TEXT,
    "nickname" TEXT,
    "year" INTEGER,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "customName" TEXT,
    "customBattery" DOUBLE PRECISION,
    "customUsable" DOUBLE PRECISION,
    "customConsumption" DOUBLE PRECISION,
    "customDcKw" DOUBLE PRECISION,
    "customConnector" "ConnectorType",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserVehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Station" (
    "id" TEXT NOT NULL,
    "ocmId" INTEGER,
    "nameEn" TEXT NOT NULL,
    "nameAr" TEXT,
    "operator" TEXT,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "address" TEXT,
    "town" TEXT,
    "status" "StationStatus" NOT NULL DEFAULT 'UNKNOWN',
    "connectors" JSONB NOT NULL,
    "maxPowerKw" DOUBLE PRECISION NOT NULL,
    "totalPoints" INTEGER NOT NULL DEFAULT 1,
    "pricing" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Station_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargingSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userVehicleId" TEXT,
    "locationType" "SessionLocation" NOT NULL,
    "stationId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "kwh" DOUBLE PRECISION NOT NULL,
    "costJod" DOUBLE PRECISION NOT NULL,
    "durationMin" INTEGER,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChargingSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- CreateIndex
CREATE INDEX "Vehicle_make_idx" ON "Vehicle"("make");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_make_model_variant_yearFrom_key" ON "Vehicle"("make", "model", "variant", "yearFrom");

-- CreateIndex
CREATE INDEX "UserVehicle_userId_idx" ON "UserVehicle"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Station_ocmId_key" ON "Station"("ocmId");

-- CreateIndex
CREATE INDEX "Station_latitude_longitude_idx" ON "Station"("latitude", "longitude");

-- CreateIndex
CREATE INDEX "ChargingSession_userId_startedAt_idx" ON "ChargingSession"("userId", "startedAt");

-- AddForeignKey
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserVehicle" ADD CONSTRAINT "UserVehicle_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_userVehicleId_fkey" FOREIGN KEY ("userVehicleId") REFERENCES "UserVehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargingSession" ADD CONSTRAINT "ChargingSession_stationId_fkey" FOREIGN KEY ("stationId") REFERENCES "Station"("id") ON DELETE SET NULL ON UPDATE CASCADE;
