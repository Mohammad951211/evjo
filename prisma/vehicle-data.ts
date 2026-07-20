/**
 * EV catalog for the Jordanian market — one tuple per battery variant.
 * Values follow manufacturer data sheets (WLTP where published; CLTC-derived
 * estimates converted for China-market models). Verify before commercial use.
 *
 * Tuple: [make, model, variant, yearFrom, yearTo, batteryKwh, usableKwh,
 *         rangeKm, kWh/100km, acKw, dcKw, connector, weightKg, drivetrain]
 */

type Conn = "CCS2" | "CHADEMO" | "GBT_DC" | "TYPE2";
type Row = [
  string, string, string, number, number | null,
  number, number, number, number, number, number, Conn, number | null, string
];

export const VEHICLE_ROWS: Row[] = [
  // ── BYD ──────────────────────────────────────────────────────────
  ["BYD", "Seal", "61.4 kWh RWD", 2022, null, 61.4, 61.4, 460, 14.6, 11, 110, "CCS2", 1922, "RWD"],
  ["BYD", "Seal", "82.6 kWh RWD", 2022, null, 82.6, 82.6, 570, 15.6, 11, 150, "CCS2", 2055, "RWD"],
  ["BYD", "Seal", "82.6 kWh AWD Performance", 2022, null, 82.6, 82.6, 520, 17.2, 11, 150, "CCS2", 2185, "AWD"],
  ["BYD", "Dolphin", "44.9 kWh", 2021, null, 44.9, 44.9, 340, 14.2, 7, 60, "CCS2", 1506, "FWD"],
  ["BYD", "Dolphin", "60.4 kWh", 2021, null, 60.4, 60.4, 427, 15.2, 11, 88, "CCS2", 1658, "FWD"],
  ["BYD", "Atto 3", "60.5 kWh", 2022, null, 60.5, 60.5, 420, 15.6, 7, 88, "CCS2", 1750, "FWD"],
  ["BYD", "Han EV", "85.4 kWh", 2020, null, 85.4, 85.4, 521, 17.6, 7, 120, "GBT_DC", 2020, "RWD"],
  ["BYD", "Tang EV", "86.4 kWh AWD", 2021, null, 86.4, 86.4, 400, 22.4, 11, 170, "CCS2", 2630, "AWD"],
  ["BYD", "Song Plus DM-i", "18.3 kWh PHEV", 2021, null, 18.3, 18.3, 110, 16.6, 6.6, 18, "GBT_DC", 1930, "FWD PHEV"],
  ["BYD", "Seal U DM-i", "18.3 kWh PHEV", 2023, null, 18.3, 18.3, 80, 18.0, 6.6, 18, "CCS2", 1940, "FWD PHEV"],
  ["BYD", "Seal U DM-i", "26.6 kWh PHEV", 2023, null, 26.6, 26.6, 125, 18.0, 6.6, 18, "CCS2", 2000, "FWD PHEV"],
  ["BYD", "Yuan Plus", "60.5 kWh", 2021, null, 60.5, 60.5, 430, 14.9, 7, 88, "GBT_DC", 1750, "FWD"],
  ["BYD", "Qin Plus EV", "57.6 kWh", 2021, null, 57.6, 57.6, 420, 13.7, 7, 89, "GBT_DC", 1740, "FWD"],

  // ── Tesla (EU-spec, CCS2) ────────────────────────────────────────
  ["Tesla", "Model 3", "RWD 60 kWh LFP", 2021, null, 60, 57.5, 513, 13.2, 11, 170, "CCS2", 1765, "RWD"],
  ["Tesla", "Model 3", "Long Range AWD", 2021, null, 78.1, 75, 629, 14.0, 11, 250, "CCS2", 1828, "AWD"],
  ["Tesla", "Model Y", "RWD 60 kWh LFP", 2022, null, 60, 57.5, 455, 15.2, 11, 170, "CCS2", 1909, "RWD"],
  ["Tesla", "Model Y", "Long Range AWD", 2022, null, 78.1, 75, 533, 15.7, 11, 250, "CCS2", 1979, "AWD"],
  ["Tesla", "Model S", "Dual Motor", 2021, null, 100, 95, 634, 17.5, 11, 250, "CCS2", 2069, "AWD"],
  ["Tesla", "Model X", "Dual Motor", 2021, null, 100, 95, 576, 19.5, 11, 250, "CCS2", 2352, "AWD"],

  // ── BMW ──────────────────────────────────────────────────────────
  ["BMW", "i4", "eDrive40", 2021, null, 83.9, 80.7, 590, 16.1, 11, 205, "CCS2", 2050, "RWD"],
  ["BMW", "i4", "M50 xDrive", 2021, null, 83.9, 80.7, 520, 18.0, 11, 195, "CCS2", 2215, "AWD"],
  ["BMW", "i5", "eDrive40", 2023, null, 84.3, 81.2, 582, 15.9, 11, 205, "CCS2", 2205, "RWD"],
  ["BMW", "i7", "xDrive60", 2022, null, 105.7, 101.7, 625, 18.4, 11, 195, "CCS2", 2640, "AWD"],
  ["BMW", "iX", "xDrive40", 2021, null, 76.6, 71, 425, 19.4, 11, 150, "CCS2", 2440, "AWD"],
  ["BMW", "iX", "xDrive50", 2021, null, 111.5, 105.2, 630, 19.8, 11, 195, "CCS2", 2510, "AWD"],
  ["BMW", "iX1", "xDrive30", 2022, null, 66.5, 64.7, 440, 16.8, 11, 130, "CCS2", 2085, "AWD"],
  ["BMW", "iX2", "xDrive30", 2023, null, 66.5, 64.7, 449, 16.3, 11, 130, "CCS2", 2100, "AWD"],
  ["BMW", "iX3", "80 kWh", 2020, 2024, 80, 74, 460, 18.5, 11, 150, "CCS2", 2260, "RWD"],

  // ── Mercedes-Benz ────────────────────────────────────────────────
  ["Mercedes-Benz", "EQA", "250+ 70.5 kWh", 2021, null, 70.5, 70.5, 560, 15.1, 11, 100, "CCS2", 2105, "FWD"],
  ["Mercedes-Benz", "EQB", "250+ 70.5 kWh", 2021, null, 70.5, 70.5, 535, 16.0, 11, 100, "CCS2", 2175, "FWD"],
  ["Mercedes-Benz", "EQC", "400 4MATIC", 2019, 2023, 80, 80, 417, 21.5, 11, 110, "CCS2", 2495, "AWD"],
  ["Mercedes-Benz", "EQE", "350+ Sedan", 2022, null, 90.6, 90.6, 639, 15.9, 11, 170, "CCS2", 2355, "RWD"],
  ["Mercedes-Benz", "EQE SUV", "350+ ", 2023, null, 90.6, 90.6, 590, 17.7, 11, 170, "CCS2", 2480, "RWD"],
  ["Mercedes-Benz", "EQS", "450+ Sedan", 2021, null, 107.8, 107.8, 780, 15.7, 11, 200, "CCS2", 2480, "RWD"],
  ["Mercedes-Benz", "EQS SUV", "450+", 2022, null, 107.8, 107.8, 660, 18.5, 11, 200, "CCS2", 2695, "RWD"],

  // ── Audi ─────────────────────────────────────────────────────────
  ["Audi", "Q4 e-tron", "45 e-tron", 2021, null, 82, 76.6, 490, 17.0, 11, 135, "CCS2", 2135, "RWD"],
  ["Audi", "Q4 e-tron", "50 quattro", 2021, null, 82, 76.6, 520, 17.6, 11, 135, "CCS2", 2210, "AWD"],
  ["Audi", "Q6 e-tron", "quattro 100 kWh", 2024, null, 100, 94.9, 625, 16.6, 11, 270, "CCS2", 2350, "AWD"],
  ["Audi", "Q8 e-tron", "55 quattro", 2023, null, 114, 106, 582, 20.6, 11, 170, "CCS2", 2585, "AWD"],
  ["Audi", "e-tron GT", "quattro", 2021, null, 93.4, 83.7, 488, 19.6, 11, 270, "CCS2", 2276, "AWD"],

  // ── Hyundai ──────────────────────────────────────────────────────
  ["Hyundai", "Ioniq 5", "58 kWh SR", 2021, null, 58, 58, 384, 16.7, 11, 175, "CCS2", 1830, "RWD"],
  ["Hyundai", "Ioniq 5", "77.4 kWh LR", 2021, null, 77.4, 77.4, 507, 16.8, 11, 235, "CCS2", 1953, "RWD"],
  ["Hyundai", "Ioniq 5", "84 kWh (facelift)", 2024, null, 84, 84, 570, 16.5, 11, 235, "CCS2", 1980, "RWD"],
  ["Hyundai", "Ioniq 6", "53 kWh SR", 2022, null, 53, 53, 429, 13.9, 11, 175, "CCS2", 1810, "RWD"],
  ["Hyundai", "Ioniq 6", "77.4 kWh LR", 2022, null, 77.4, 77.4, 614, 14.3, 11, 235, "CCS2", 1930, "RWD"],
  ["Hyundai", "Kona Electric", "48.6 kWh", 2023, null, 48.6, 48.6, 377, 14.7, 11, 74, "CCS2", 1690, "FWD"],
  ["Hyundai", "Kona Electric", "65.4 kWh", 2023, null, 65.4, 65.4, 514, 14.6, 11, 102, "CCS2", 1773, "FWD"],

  // ── Kia ──────────────────────────────────────────────────────────
  ["Kia", "EV6", "58 kWh SR", 2021, null, 58, 58, 394, 16.5, 11, 180, "CCS2", 1875, "RWD"],
  ["Kia", "EV6", "77.4 kWh LR", 2021, null, 77.4, 77.4, 528, 16.5, 11, 240, "CCS2", 1985, "RWD"],
  ["Kia", "EV9", "99.8 kWh LR", 2023, null, 99.8, 99.8, 563, 20.2, 11, 210, "CCS2", 2552, "RWD"],
  ["Kia", "Niro EV", "64.8 kWh", 2022, null, 64.8, 64.8, 460, 16.2, 11, 72, "CCS2", 1739, "FWD"],

  // ── Volkswagen ───────────────────────────────────────────────────
  ["Volkswagen", "ID.3", "Pro 58 kWh", 2020, null, 62, 58, 426, 15.3, 11, 120, "CCS2", 1812, "RWD"],
  ["Volkswagen", "ID.3", "Pro S 77 kWh", 2020, null, 82, 77, 546, 15.9, 11, 170, "CCS2", 1934, "RWD"],
  ["Volkswagen", "ID.4", "Pro 77 kWh", 2021, null, 82, 77, 522, 16.3, 11, 135, "CCS2", 2124, "RWD"],
  ["Volkswagen", "ID.6", "Crozz Pro 84.8 kWh", 2021, null, 84.8, 84.8, 460, 18.9, 11, 100, "GBT_DC", 2280, "RWD"],

  // ── MG ───────────────────────────────────────────────────────────
  ["MG", "MG4", "51 kWh Standard", 2022, null, 51, 50.8, 350, 16.0, 7, 88, "CCS2", 1655, "RWD"],
  ["MG", "MG4", "64 kWh Comfort/Luxury", 2022, null, 64, 61.7, 450, 16.0, 11, 135, "CCS2", 1685, "RWD"],
  ["MG", "MG5 EV", "61.1 kWh LR", 2021, null, 61.1, 57.4, 400, 16.6, 11, 87, "CCS2", 1562, "FWD"],
  ["MG", "Marvel R", "70 kWh", 2021, null, 70, 65, 402, 19.4, 11, 94, "CCS2", 1920, "RWD"],
  ["MG", "ZS EV", "51 kWh Standard", 2021, null, 51, 49, 320, 17.3, 7, 76, "CCS2", 1570, "FWD"],
  ["MG", "ZS EV", "72 kWh Long Range", 2021, null, 72.6, 68.3, 440, 17.4, 11, 92, "CCS2", 1620, "FWD"],
  ["MG", "MG7", "PHEV (est. importer spec)", 2023, null, 16.6, 16.6, 70, 20.0, 6.6, 0, "TYPE2", 1690, "FWD PHEV"],
  ["MG", "Cyberster", "64 kWh RWD", 2024, null, 64, 61.7, 443, 16.2, 11, 144, "CCS2", 1850, "RWD"],
  ["MG", "Cyberster", "77 kWh AWD", 2024, null, 77, 74.4, 519, 17.0, 11, 144, "CCS2", 1985, "AWD"],

  // ── Chery ────────────────────────────────────────────────────────
  ["Chery", "eQ7", "67 kWh", 2023, null, 67, 64, 430, 16.5, 9.9, 80, "GBT_DC", 1980, "RWD"],
  ["Chery", "Tiggo 8 Pro e+", "19.3 kWh PHEV", 2022, null, 19.3, 19.3, 75, 20.0, 6.6, 0, "TYPE2", 1985, "FWD PHEV"],
  ["Chery", "Omoda E5", "61 kWh", 2023, null, 61, 61, 430, 15.5, 9.9, 80, "CCS2", 1710, "FWD"],
  ["Chery", "Arrizo 5e", "54.3 kWh", 2019, null, 54.3, 54.3, 400, 15.0, 6.6, 60, "GBT_DC", 1560, "FWD"],

  // ── Nissan ───────────────────────────────────────────────────────
  ["Nissan", "Leaf", "40 kWh", 2018, null, 40, 39, 270, 15.5, 6.6, 50, "CHADEMO", 1580, "FWD"],
  ["Nissan", "Leaf", "e+ 62 kWh", 2019, null, 62, 59, 385, 16.5, 6.6, 100, "CHADEMO", 1756, "FWD"],
  ["Nissan", "Ariya", "63 kWh", 2022, null, 66, 63, 403, 17.4, 22, 130, "CCS2", 1980, "FWD"],
  ["Nissan", "Ariya", "87 kWh", 2022, null, 91, 87, 533, 18.1, 22, 130, "CCS2", 2154, "FWD"],

  // ── Polestar ─────────────────────────────────────────────────────
  ["Polestar", "Polestar 2", "Standard Range 69 kWh", 2023, null, 69, 67, 532, 14.8, 11, 135, "CCS2", 2005, "RWD"],
  ["Polestar", "Polestar 2", "Long Range 82 kWh", 2023, null, 82, 79, 655, 14.9, 11, 205, "CCS2", 2075, "RWD"],
  ["Polestar", "Polestar 3", "111 kWh LR Dual", 2023, null, 111, 107, 610, 20.1, 11, 250, "CCS2", 2584, "AWD"],
  ["Polestar", "Polestar 4", "100 kWh LR", 2024, null, 100, 94, 620, 17.6, 22, 200, "CCS2", 2230, "RWD"],

  // ── Volvo ────────────────────────────────────────────────────────
  ["Volvo", "EX30", "Single Motor 51 kWh", 2023, null, 51, 49, 344, 16.0, 11, 134, "CCS2", 1765, "RWD"],
  ["Volvo", "EX30", "Extended Range 69 kWh", 2023, null, 69, 64, 476, 15.6, 22, 153, "CCS2", 1830, "RWD"],
  ["Volvo", "EX40", "Single Extended 82 kWh", 2024, null, 82, 79, 573, 16.4, 11, 200, "CCS2", 2075, "RWD"],
  ["Volvo", "EC40", "Single Extended 82 kWh", 2024, null, 82, 79, 581, 16.1, 11, 200, "CCS2", 2065, "RWD"],
  ["Volvo", "XC40 Recharge", "Twin 78 kWh", 2021, 2023, 78, 75, 425, 20.0, 11, 150, "CCS2", 2188, "AWD"],
  ["Volvo", "EX90", "Twin 111 kWh", 2024, null, 111, 107, 585, 20.5, 11, 250, "CCS2", 2818, "AWD"],

  // ── Zeekr (CN import, GB/T) ──────────────────────────────────────
  ["Zeekr", "001", "100 kWh Long Range", 2021, null, 100, 94, 580, 17.5, 11, 200, "GBT_DC", 2350, "AWD"],
  ["Zeekr", "X", "66 kWh", 2023, null, 66, 64, 445, 16.0, 11, 150, "GBT_DC", 1960, "RWD"],
  ["Zeekr", "007", "75 kWh", 2024, null, 75, 72, 540, 14.5, 11, 310, "GBT_DC", 2120, "RWD"],
  ["Zeekr", "009", "116 kWh", 2023, null, 116, 111, 640, 19.5, 11, 200, "GBT_DC", 2830, "AWD"],

  // ── GAC Aion (CN import, GB/T) ───────────────────────────────────
  ["GAC Aion", "S Plus", "70 kWh", 2021, null, 70, 67, 460, 14.8, 6.6, 76, "GBT_DC", 1695, "FWD"],
  ["GAC Aion", "Y Plus", "63.2 kWh", 2022, null, 63.2, 61, 430, 15.0, 6.6, 70, "GBT_DC", 1720, "FWD"],
  ["GAC Aion", "V", "75.3 kWh", 2021, null, 75.3, 72, 450, 16.5, 6.6, 76, "GBT_DC", 1900, "FWD"],

  // ── Changan (CN import, GB/T) ────────────────────────────────────
  ["Changan", "Deepal S07", "66.8 kWh EV", 2023, null, 66.8, 64, 430, 15.5, 11, 92, "GBT_DC", 1980, "RWD"],
  ["Changan", "Deepal SL03", "58.1 kWh EV", 2022, null, 58.1, 56, 430, 13.8, 11, 92, "GBT_DC", 1840, "RWD"],
  ["Changan", "UNI-V iDD", "18.4 kWh PHEV", 2023, null, 18.4, 18.4, 90, 17.5, 6.6, 0, "TYPE2", 1750, "FWD PHEV"],
  ["Changan", "Lumin", "28 kWh", 2022, null, 28, 27, 210, 11.5, 3.5, 30, "GBT_DC", 840, "RWD"],
  ["Changan", "E-Star", "32 kWh", 2020, null, 32, 30.7, 240, 12.0, 6.6, 45, "GBT_DC", 1060, "FWD"],
  ["Changan", "Eado EV460", "57 kWh", 2019, null, 57, 54, 380, 14.5, 6.6, 70, "GBT_DC", 1660, "FWD"],

  // ── Jetour ───────────────────────────────────────────────────────
  ["Jetour", "Dashing EV", "60 kWh (importer spec)", 2023, null, 60, 58, 400, 15.5, 6.6, 80, "GBT_DC", 1780, "FWD"],

  // ── Hongqi ───────────────────────────────────────────────────────
  ["Hongqi", "E-HS9", "99 kWh", 2021, null, 99, 92, 465, 22.5, 11, 92, "CCS2", 2731, "AWD"],
  ["Hongqi", "EHS7", "85 kWh", 2024, null, 85, 82, 550, 15.8, 11, 200, "GBT_DC", 2280, "RWD"],

  // ── Geely (CN import, GB/T) ──────────────────────────────────────
  ["Geely", "Geometry C", "53 kWh", 2020, null, 53, 51, 370, 14.5, 6.6, 57, "GBT_DC", 1620, "FWD"],
  ["Geely", "Geometry C", "70 kWh", 2020, null, 70, 67, 460, 15.0, 6.6, 80, "GBT_DC", 1710, "FWD"],
  ["Geely", "Galaxy E5", "60.2 kWh", 2024, null, 60.2, 58, 440, 14.0, 11, 100, "GBT_DC", 1780, "FWD"],
  ["Geely", "Galaxy E8", "76 kWh", 2024, null, 76, 73, 510, 15.0, 11, 260, "GBT_DC", 2115, "RWD"],

  // ── XPENG ────────────────────────────────────────────────────────
  ["XPENG", "G6", "66 kWh RWD", 2023, null, 66, 62.8, 435, 15.6, 11, 215, "CCS2", 1995, "RWD"],
  ["XPENG", "G6", "87.5 kWh RWD LR", 2023, null, 87.5, 83.3, 570, 15.8, 11, 280, "CCS2", 2085, "RWD"],
  ["XPENG", "G9", "78.2 kWh RWD", 2022, null, 78.2, 75, 460, 17.2, 11, 260, "CCS2", 2240, "RWD"],
  ["XPENG", "G9", "98 kWh RWD LR", 2022, null, 98, 93.9, 570, 17.4, 11, 300, "CCS2", 2340, "RWD"],
  ["XPENG", "P7", "80.9 kWh RWD", 2020, null, 80.9, 76.6, 530, 15.5, 11, 135, "CCS2", 1960, "RWD"],

  // ── NIO ──────────────────────────────────────────────────────────
  ["NIO", "ET5", "75 kWh", 2022, null, 75, 73.5, 456, 17.1, 11, 140, "CCS2", 2145, "AWD"],
  ["NIO", "ET7", "100 kWh", 2022, null, 100, 96, 580, 17.7, 11, 140, "CCS2", 2379, "AWD"],
  ["NIO", "EL6", "75 kWh", 2022, null, 75, 73.5, 406, 19.2, 11, 140, "CCS2", 2345, "AWD"],
  ["NIO", "EL7", "100 kWh", 2022, null, 100, 96, 509, 19.9, 11, 140, "CCS2", 2470, "AWD"],

  // ── Li Auto (EREV, GB/T) ─────────────────────────────────────────
  ["Li Auto", "L6", "36.8 kWh EREV", 2024, null, 36.8, 34, 180, 19.5, 11, 71, "GBT_DC", 2330, "AWD EREV"],
  ["Li Auto", "L7", "42.8 kWh EREV", 2023, null, 42.8, 39, 200, 20.5, 11, 65, "GBT_DC", 2456, "AWD EREV"],
  ["Li Auto", "L8", "42.8 kWh EREV", 2022, null, 42.8, 39, 200, 21.0, 11, 65, "GBT_DC", 2520, "AWD EREV"],
  ["Li Auto", "L9", "44.5 kWh EREV", 2022, null, 44.5, 41, 215, 21.5, 11, 65, "GBT_DC", 2560, "AWD EREV"],

  // ── Leapmotor ────────────────────────────────────────────────────
  ["Leapmotor", "C10", "69.9 kWh", 2024, null, 69.9, 66, 420, 16.8, 6.6, 84, "CCS2", 1980, "RWD"],
  ["Leapmotor", "C11", "78.5 kWh", 2021, null, 78.5, 74, 480, 16.5, 6.6, 84, "GBT_DC", 2010, "RWD"],
  ["Leapmotor", "T03", "37.3 kWh", 2020, null, 37.3, 36.5, 265, 14.3, 6.6, 48, "CCS2", 1175, "FWD"],

  // ── Voyah ────────────────────────────────────────────────────────
  ["Voyah", "Free", "88 kWh EV", 2021, null, 88, 85, 460, 19.5, 11, 100, "CCS2", 2280, "AWD"],
  ["Voyah", "Dreamer", "108.9 kWh EV", 2022, null, 108.9, 104, 480, 22.5, 11, 100, "GBT_DC", 2800, "AWD"],
  ["Voyah", "Passion", "108.9 kWh EV", 2023, null, 108.9, 104, 580, 18.0, 11, 140, "GBT_DC", 2340, "AWD"],

  // ── Ora ──────────────────────────────────────────────────────────
  ["Ora", "Good Cat", "47.8 kWh", 2020, null, 47.8, 45.9, 310, 15.5, 6.6, 67, "CCS2", 1510, "FWD"],
  ["Ora", "03", "63 kWh LR", 2022, null, 63, 59.3, 420, 15.9, 11, 88, "CCS2", 1580, "FWD"],

  // ── Skywell ──────────────────────────────────────────────────────
  ["Skywell", "ET5", "72 kWh", 2021, null, 72, 68.7, 401, 18.5, 11, 80, "CCS2", 1920, "FWD"],

  // ── Dongfeng ─────────────────────────────────────────────────────
  ["Dongfeng", "Box", "42.3 kWh", 2023, null, 42.3, 40.9, 310, 13.9, 6.6, 71, "CCS2", 1245, "RWD"],
  ["Dongfeng", "Nammi 01", "31.5 kWh", 2023, null, 31.5, 30, 245, 12.8, 6.6, 55, "GBT_DC", 1180, "RWD"],

  // ── Avatr (GB/T) ─────────────────────────────────────────────────
  ["Avatr", "11", "90.4 kWh", 2022, null, 90.4, 87, 480, 18.5, 11, 240, "GBT_DC", 2295, "AWD"],
  ["Avatr", "11", "116.8 kWh", 2022, null, 116.8, 112, 600, 19.0, 11, 240, "GBT_DC", 2380, "AWD"],
  ["Avatr", "12", "94.5 kWh", 2023, null, 94.5, 91, 570, 16.5, 11, 240, "GBT_DC", 2280, "RWD"],

  // ── Smart ────────────────────────────────────────────────────────
  ["Smart", "#1", "66 kWh Premium", 2022, null, 66, 62, 440, 16.8, 22, 150, "CCS2", 1820, "RWD"],
  ["Smart", "#3", "66 kWh Premium", 2023, null, 66, 62, 455, 16.3, 22, 150, "CCS2", 1810, "RWD"],

  // ── Renault ──────────────────────────────────────────────────────
  ["Renault", "Megane E-Tech", "EV60", 2022, null, 60, 60, 450, 15.8, 22, 130, "CCS2", 1636, "FWD"],
  ["Renault", "Zoe", "ZE50 R135", 2019, 2024, 55, 52, 395, 17.2, 22, 50, "CCS2", 1502, "FWD"],

  // ── Peugeot ──────────────────────────────────────────────────────
  ["Peugeot", "e-208", "50 kWh", 2019, null, 50, 46.3, 362, 15.4, 11, 100, "CCS2", 1455, "FWD"],
  ["Peugeot", "e-208", "51 kWh (2023+)", 2023, null, 51, 48.1, 400, 14.5, 11, 100, "CCS2", 1455, "FWD"],
  ["Peugeot", "e-2008", "50 kWh", 2020, null, 50, 46.3, 345, 16.2, 11, 100, "CCS2", 1548, "FWD"],
  ["Peugeot", "e-2008", "54 kWh (2023+)", 2023, null, 54, 50.8, 406, 15.1, 11, 100, "CCS2", 1548, "FWD"],
  ["Peugeot", "e-308", "54 kWh", 2023, null, 54, 50.8, 412, 14.7, 11, 100, "CCS2", 1611, "FWD"],

  // ── Opel ─────────────────────────────────────────────────────────
  ["Opel", "Corsa-e", "50 kWh", 2020, null, 50, 46.3, 357, 15.6, 11, 100, "CCS2", 1455, "FWD"],
  ["Opel", "Mokka-e", "50 kWh", 2021, null, 50, 46.3, 338, 16.4, 11, 100, "CCS2", 1523, "FWD"],

  // ── Fiat ─────────────────────────────────────────────────────────
  ["Fiat", "500e", "24 kWh", 2020, null, 23.8, 21.3, 190, 13.0, 11, 50, "CCS2", 1290, "FWD"],
  ["Fiat", "500e", "42 kWh", 2020, null, 42, 37.3, 320, 13.8, 11, 85, "CCS2", 1365, "FWD"],

  // ── Porsche ──────────────────────────────────────────────────────
  ["Porsche", "Taycan", "Performance Battery 79 kWh", 2020, null, 79.2, 71, 431, 19.4, 11, 225, "CCS2", 2050, "RWD"],
  ["Porsche", "Taycan", "Performance Battery Plus 93 kWh", 2020, null, 93.4, 83.7, 484, 20.2, 11, 270, "CCS2", 2130, "RWD"],
  ["Porsche", "Taycan", "105 kWh (2024 facelift)", 2024, null, 105, 97, 678, 16.7, 11, 320, "CCS2", 2185, "RWD"],
  ["Porsche", "Macan EV", "100 kWh 4", 2024, null, 100, 95, 613, 17.9, 11, 270, "CCS2", 2330, "AWD"],

  // ── Lucid ────────────────────────────────────────────────────────
  ["Lucid", "Air", "Pure RWD 88 kWh", 2022, null, 88, 84, 747, 13.5, 22, 250, "CCS2", 2180, "RWD"],
  ["Lucid", "Air", "Grand Touring 112 kWh", 2022, null, 112, 107, 839, 14.8, 22, 300, "CCS2", 2360, "AWD"],

  // ── Cadillac ─────────────────────────────────────────────────────
  ["Cadillac", "Lyriq", "102 kWh RWD", 2023, null, 102, 100, 530, 20.5, 11, 190, "CCS2", 2577, "RWD"],

  // ── Ford ─────────────────────────────────────────────────────────
  ["Ford", "Mustang Mach-E", "Standard Range 72 kWh", 2021, null, 75.7, 70, 440, 17.2, 11, 115, "CCS2", 2085, "RWD"],
  ["Ford", "Mustang Mach-E", "Extended Range 91 kWh", 2021, null, 98.7, 91, 600, 16.5, 11, 150, "CCS2", 2218, "RWD"],
];

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export const VEHICLES = VEHICLE_ROWS.map((r) => ({
  make: r[0],
  model: r[1],
  variant: r[2],
  yearFrom: r[3],
  yearTo: r[4],
  batteryKwh: r[5],
  usableKwh: r[6],
  rangeKm: r[7],
  consumption: r[8],
  acKw: r[9],
  dcKw: r[10],
  connector: r[11],
  weightKg: r[12],
  drivetrain: r[13],
  image: `${slug(r[0])}-${slug(r[1])}.webp`,
}));
