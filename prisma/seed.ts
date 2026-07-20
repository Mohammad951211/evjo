import { PrismaClient, ConnectorType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { VEHICLES } from "./vehicle-data";
import { normalizeJordanPhone } from "../lib/phone";

const prisma = new PrismaClient();

/** Creates/promotes the admin account from ADMIN_PHONE / ADMIN_PASSWORD env. */
async function seedAdmin() {
  const rawPhone = process.env.ADMIN_PHONE;
  const password = process.env.ADMIN_PASSWORD;
  if (!rawPhone || !password) {
    console.log("ADMIN_PHONE / ADMIN_PASSWORD not set — skipping admin.");
    return;
  }
  const phone = normalizeJordanPhone(rawPhone) ?? rawPhone;
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { phone },
    create: {
      name: "Admin",
      phone,
      passwordHash,
      isAdmin: true,
      phoneVerified: true,
      onboarded: true,
    },
    update: { isAdmin: true, phoneVerified: true, passwordHash },
  });
  console.log(`Admin ready: ${phone}`);
}

/**
 * Fallback fast-charging stations across Jordan, used when the live
 * OpenChargeMap import is unavailable (no network / no OCM_API_KEY quota).
 * Coordinates are approximate public locations.
 */
const FALLBACK_STATIONS = [
  { nameEn: "EVC Fast Charger — Mecca Mall", nameAr: "شاحن سريع — مكة مول", operator: "EVC Jordan", lat: 31.9761, lng: 35.8459, town: "Amman", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "ChargePlus — City Mall", nameAr: "تشارج بلس — سيتي مول", operator: "ChargePlus", lat: 31.9819, lng: 35.8341, town: "Amman", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }] },
  { nameEn: "Manaseer DC — Airport Road", nameAr: "المناصير — طريق المطار", operator: "Manaseer", lat: 31.8353, lng: 35.9028, town: "Amman", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }, { type: "CHADEMO", powerKw: 50, quantity: 1 }] },
  { nameEn: "Manaseer DC — Queen Alia Airport", nameAr: "المناصير — مطار الملكة علياء", operator: "Manaseer", lat: 31.7226, lng: 35.9932, town: "Airport", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }] },
  { nameEn: "EVC — Abdali Boulevard", nameAr: "شاحن سريع — بوليفارد العبدلي", operator: "EVC Jordan", lat: 31.9622, lng: 35.9106, town: "Amman", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 2 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Fast Charge — Swefieh Village", nameAr: "شحن سريع — قرية الصويفية", operator: "ChargePlus", lat: 31.9351, lng: 35.8615, town: "Amman", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "Manaseer DC — Zarqa Highway", nameAr: "المناصير — طريق الزرقاء", operator: "Manaseer", lat: 32.0450, lng: 36.0300, town: "Zarqa", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }, { type: "GBT_DC", powerKw: 120, quantity: 1 }] },
  { nameEn: "Irbid DC Hub — University Street", nameAr: "شاحن إربد — شارع الجامعة", operator: "EVC Jordan", lat: 32.5391, lng: 35.8623, town: "Irbid", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }] },
  { nameEn: "Manaseer DC — Desert Highway (Qatraneh)", nameAr: "المناصير — الطريق الصحراوي (القطرانة)", operator: "Manaseer", lat: 31.2400, lng: 36.0470, town: "Qatraneh", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }, { type: "GBT_DC", powerKw: 120, quantity: 1 }] },
  { nameEn: "Manaseer DC — Ma'an Rest Area", nameAr: "المناصير — استراحة معان", operator: "Manaseer", lat: 30.2050, lng: 35.7300, town: "Ma'an", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }] },
  { nameEn: "Aqaba DC — Ayla Marina", nameAr: "شاحن العقبة — مرسى أيلة", operator: "ChargePlus", lat: 29.5478, lng: 34.9987, town: "Aqaba", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }, { type: "CHADEMO", powerKw: 50, quantity: 1 }] },
  { nameEn: "Dead Sea DC — Hotels Strip", nameAr: "شاحن البحر الميت — منطقة الفنادق", operator: "EVC Jordan", lat: 31.7160, lng: 35.5900, town: "Sweimeh", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "Madaba DC — King's Highway", nameAr: "شاحن مأدبا — الطريق الملوكي", operator: "Manaseer", lat: 31.7180, lng: 35.7940, town: "Madaba", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Jerash DC — North Gate", nameAr: "شاحن جرش — البوابة الشمالية", operator: "EVC Jordan", lat: 32.2760, lng: 35.8890, town: "Jerash", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }] },
  { nameEn: "Petra DC — Wadi Musa Visitor Center", nameAr: "شاحن البترا — مركز زوار وادي موسى", operator: "ChargePlus", lat: 30.3220, lng: 35.4790, town: "Wadi Musa", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }] },
  { nameEn: "Manaseer DC — Yajouz Road", nameAr: "المناصير — طريق ياجوز", operator: "Manaseer", lat: 32.0210, lng: 35.9850, town: "Amman", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Manaseer DC — Irbid Highway (Al-Husn)", nameAr: "المناصير — طريق إربد (الحصن)", operator: "Manaseer", lat: 32.4900, lng: 35.8800, town: "Al-Husn", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }] },
  { nameEn: "Manaseer DC — Jordan Valley (Deir Alla)", nameAr: "المناصير — الأغوار (دير علا)", operator: "Manaseer", lat: 32.1960, lng: 35.6200, town: "Deir Alla", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Manaseer DC — Quweira (Aqaba Road)", nameAr: "المناصير — القويرة (طريق العقبة)", operator: "Manaseer", lat: 29.8000, lng: 35.3100, town: "Quweira", maxKw: 150, conns: [{ type: "CCS2", powerKw: 150, quantity: 2 }] },
  { nameEn: "Manaseer DC — Azraq Highway", nameAr: "المناصير — طريق الأزرق", operator: "Manaseer", lat: 31.8800, lng: 36.4900, town: "Azraq", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }, { type: "GBT_DC", powerKw: 120, quantity: 1 }] },
  { nameEn: "Manaseer DC — Salt Highway", nameAr: "المناصير — طريق السلط", operator: "Manaseer", lat: 32.0200, lng: 35.7900, town: "As-Salt", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 2 }] },
  { nameEn: "Manaseer DC — Madounah Road", nameAr: "المناصير — طريق المدونة", operator: "Manaseer", lat: 31.8300, lng: 36.0600, town: "Amman", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }] },
  { nameEn: "EVC — Taj Mall", nameAr: "شاحن سريع — تاج مول", operator: "EVC Jordan", lat: 31.9450, lng: 35.8900, town: "Amman", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 2 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "EVC — Galleria Mall (Abdoun)", nameAr: "شاحن سريع — جاليريا مول (عبدون)", operator: "EVC Jordan", lat: 31.9500, lng: 35.8800, town: "Amman", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "EVC — Dabouq", nameAr: "شاحن سريع — دابوق", operator: "EVC Jordan", lat: 31.9800, lng: 35.8200, town: "Amman", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "ChargePlus — Sweileh", nameAr: "تشارج بلس — صويلح", operator: "ChargePlus", lat: 32.0200, lng: 35.8500, town: "Amman", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "ChargePlus — University of Jordan", nameAr: "تشارج بلس — الجامعة الأردنية", operator: "ChargePlus", lat: 32.0100, lng: 35.8700, town: "Amman", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 2 }] },
  { nameEn: "ChargePlus — Marka", nameAr: "تشارج بلس — ماركا", operator: "ChargePlus", lat: 31.9800, lng: 35.9800, town: "Amman", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Karak DC — Castle Road", nameAr: "شاحن الكرك — طريق القلعة", operator: "EVC Jordan", lat: 31.1800, lng: 35.7000, town: "Karak", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Irbid DC — City Center Mall", nameAr: "شاحن إربد — سيتي سنتر", operator: "ChargePlus", lat: 32.5500, lng: 35.8500, town: "Irbid", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "Mafraq DC — Baghdad Road", nameAr: "شاحن المفرق — طريق بغداد", operator: "Manaseer", lat: 32.3400, lng: 36.2000, town: "Mafraq", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }] },
  { nameEn: "Tafilah DC — Main Street", nameAr: "شاحن الطفيلة — الشارع الرئيسي", operator: "EVC Jordan", lat: 30.8400, lng: 35.6000, town: "Tafilah", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }] },
  { nameEn: "Dead Sea DC — Samarah Mall", nameAr: "شاحن البحر الميت — سمارة مول", operator: "ChargePlus", lat: 31.7300, lng: 35.5900, town: "Sweimeh", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 2 }] },
  { nameEn: "Wadi Rum DC — Village Gate", nameAr: "شاحن وادي رم — بوابة القرية", operator: "EVC Jordan", lat: 29.5800, lng: 35.4200, town: "Wadi Rum", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }] },
  { nameEn: "Aqaba DC — Tala Bay", nameAr: "شاحن العقبة — تالا باي", operator: "ChargePlus", lat: 29.3800, lng: 34.9800, town: "Aqaba", maxKw: 90, conns: [{ type: "CCS2", powerKw: 90, quantity: 2 }] },
  { nameEn: "Jerash DC — Amman Road", nameAr: "شاحن جرش — طريق عمّان", operator: "Manaseer", lat: 32.2400, lng: 35.8800, town: "Jerash", maxKw: 120, conns: [{ type: "CCS2", powerKw: 120, quantity: 1 }, { type: "GBT_DC", powerKw: 60, quantity: 1 }] },
  { nameEn: "Ajloun DC — Castle Road", nameAr: "شاحن عجلون — طريق القلعة", operator: "EVC Jordan", lat: 32.3300, lng: 35.7500, town: "Ajloun", maxKw: 60, conns: [{ type: "CCS2", powerKw: 60, quantity: 1 }] },
];

async function seedVehicles() {
  console.log(`Seeding ${VEHICLES.length} vehicle variants…`);
  for (const v of VEHICLES) {
    await prisma.vehicle.upsert({
      where: {
        make_model_variant_yearFrom: {
          make: v.make,
          model: v.model,
          variant: v.variant,
          yearFrom: v.yearFrom,
        },
      },
      create: { ...v, connector: v.connector as ConnectorType },
      update: { ...v, connector: v.connector as ConnectorType },
    });
  }
  console.log("Vehicles seeded.");
}

async function seedStationsFromOcm(): Promise<boolean> {
  const key = process.env.OCM_API_KEY;
  const url = new URL("https://api.openchargemap.io/v3/poi/");
  url.searchParams.set("output", "json");
  url.searchParams.set("countrycode", "JO");
  url.searchParams.set("maxresults", "500");
  if (key) url.searchParams.set("key", key);

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "EVJO-seed/1.0" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const pois = (await res.json()) as any[];

    const DC_IDS: Record<number, string> = { 33: "CCS2", 2: "CHADEMO", 1036: "GBT_DC", 1038: "GBT_DC" };
    let count = 0;

    for (const poi of pois) {
      const lat = poi.AddressInfo?.Latitude;
      const lng = poi.AddressInfo?.Longitude;
      if (lat == null || lng == null) continue;

      const conns = (poi.Connections ?? [])
        .map((c: any) => {
          const id = c.ConnectionTypeID ?? c.ConnectionType?.ID;
          let type = id != null ? DC_IDS[id] : undefined;
          if (!type) {
            const title = (c.ConnectionType?.Title ?? "").toLowerCase();
            if (title.includes("ccs")) type = "CCS2";
            else if (title.includes("chademo")) type = "CHADEMO";
            else if (title.includes("gb") && title.includes("dc")) type = "GBT_DC";
          }
          return type ? { type, powerKw: c.PowerKW ?? 0, quantity: c.Quantity ?? 1 } : null;
        })
        .filter((c: any) => c && c.powerKw >= 50);

      if (conns.length === 0) continue;

      const maxPowerKw = Math.max(...conns.map((c: any) => c.powerKw));
      await prisma.station.upsert({
        where: { ocmId: poi.ID },
        create: {
          ocmId: poi.ID,
          nameEn: poi.AddressInfo?.Title ?? `Station ${poi.ID}`,
          operator: poi.OperatorInfo?.Title ?? null,
          latitude: lat,
          longitude: lng,
          address: poi.AddressInfo?.AddressLine1 ?? null,
          town: poi.AddressInfo?.Town ?? null,
          status: poi.StatusType?.IsOperational === false ? "OFFLINE" : poi.StatusType?.IsOperational ? "OPERATIONAL" : "UNKNOWN",
          connectors: conns,
          maxPowerKw,
          totalPoints: poi.NumberOfPoints ?? conns.length,
          pricing: poi.UsageCost ?? null,
        },
        update: { connectors: conns, maxPowerKw, status: poi.StatusType?.IsOperational === false ? "OFFLINE" : "OPERATIONAL" },
      });
      count++;
    }
    console.log(`OpenChargeMap import: ${count} fast stations.`);
    return count > 0;
  } catch (err) {
    console.warn(`OpenChargeMap import failed (${err}) — using fallback list.`);
    return false;
  }
}

async function seedFallbackStations() {
  for (const s of FALLBACK_STATIONS) {
    const existing = await prisma.station.findFirst({ where: { nameEn: s.nameEn } });
    const data = {
      nameEn: s.nameEn,
      nameAr: s.nameAr,
      operator: s.operator,
      latitude: s.lat,
      longitude: s.lng,
      town: s.town,
      status: "OPERATIONAL" as const,
      connectors: s.conns,
      maxPowerKw: s.maxKw,
      totalPoints: s.conns.reduce((a, c) => a + c.quantity, 0),
    };
    if (existing) {
      await prisma.station.update({ where: { id: existing.id }, data });
    } else {
      await prisma.station.create({ data });
    }
  }
  console.log(`Seeded ${FALLBACK_STATIONS.length} fallback stations.`);
}

async function main() {
  await seedVehicles();
  await seedAdmin();
  const ok = await seedStationsFromOcm();
  if (!ok) await seedFallbackStations();
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
