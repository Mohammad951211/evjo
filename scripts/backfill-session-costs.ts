/**
 * One-off: price any charging session stored with costJod = 0 using the
 * TOU tariff engine, in JOD. Run with: npx tsx scripts/backfill-session-costs.ts
 */
import { PrismaClient } from "@prisma/client";
import { computeChargeCost, type RateContext } from "../lib/tariff";

const prisma = new PrismaClient();

async function main() {
  const sessions = await prisma.chargingSession.findMany({
    where: { costJod: { lte: 0 }, kwh: { gt: 0 } },
    include: {
      user: true,
      userVehicle: { include: { vehicle: true } },
    },
  });
  console.log(`Repricing ${sessions.length} zero-cost sessions…`);

  for (const s of sessions) {
    let powerKw: number;
    let ctx: RateContext;
    if (s.locationType === "STATION") {
      powerKw = s.userVehicle?.vehicle?.dcKw ?? s.userVehicle?.customDcKw ?? 60;
      ctx = { location: "station" };
    } else {
      powerKw = s.user.homeChargerKw ?? 7.4;
      ctx =
        s.user.meterType === "SERVICES_METER"
          ? { location: "home", meterType: "SERVICES_METER", tier: s.user.servicesTier ?? 2 }
          : { location: "home", meterType: "EV_METER" };
    }
    const priced = computeChargeCost({
      kwhNeeded: s.kwh,
      powerKw: Math.max(powerKw, 1),
      start: s.startedAt,
      ctx,
    });
    await prisma.chargingSession.update({
      where: { id: s.id },
      data: { costJod: priced.totalCost, durationMin: s.durationMin ?? priced.durationMin },
    });
    console.log(`  ${s.id}: ${s.kwh} kWh → ${priced.totalCost} JOD`);
  }
  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
