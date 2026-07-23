/** One-off: remove catalog rows that were corrected/renamed in vehicle-data.ts
 *  (kept only if a user's garage already references them).
 *  Run: npx tsx scripts/cleanup-catalog.ts */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const STALE: { make: string; model: string; variant: string }[] = [
  // MG7 is petrol-only — the PHEV entry was wrong
  { make: "MG", model: "MG7", variant: "PHEV (est. importer spec)" },
  // Jetour Dashing has no full-EV version — replaced by the real i-DM PHEV
  { make: "Jetour", model: "Dashing EV", variant: "60 kWh (importer spec)" },
  // Kona facelift standard pack is 48.4 kWh per Hyundai — relabeled
  { make: "Hyundai", model: "Kona Electric", variant: "48.6 kWh" },
  // Nammi 01 merged into Dongfeng Box (same car)
  { make: "Dongfeng", model: "Nammi 01", variant: "31.5 kWh" },
];

async function main() {
  for (const s of STALE) {
    const row = await prisma.vehicle.findFirst({
      where: { make: s.make, model: s.model, variant: s.variant },
      include: { _count: { select: { userVehicles: true } } },
    });
    if (!row) {
      console.log(`not present: ${s.make} ${s.model} ${s.variant}`);
      continue;
    }
    if (row._count.userVehicles > 0) {
      console.log(`SKIPPED (in use by ${row._count.userVehicles} garage(s)): ${s.make} ${s.model} ${s.variant}`);
      continue;
    }
    await prisma.vehicle.delete({ where: { id: row.id } });
    console.log(`deleted: ${s.make} ${s.model} ${s.variant}`);
  }
  console.log("total catalog rows now:", await prisma.vehicle.count());
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
