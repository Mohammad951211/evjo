-- In-app notifications (favorite-station offline / price-change alerts).

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('STATION_OFFLINE', 'STATION_PRICE');

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "stationId" TEXT,
    "stationNameEn" TEXT NOT NULL,
    "stationNameAr" TEXT,
    "oldValue" TEXT,
    "newValue" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Keep the security posture consistent: RLS on (the app connects as the
-- postgres role, which has BYPASSRLS, so this does not affect it).
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
