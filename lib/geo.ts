/** Haversine distance in km. */
export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Road distance estimate: haversine × winding factor for Jordan's road network. */
export function roadKm(straightKm: number): number {
  return straightKm * 1.28;
}

/** Drive-time estimate in minutes (city ≈ 36 km/h short hops, highway ≈ 78 km/h). */
export function driveMinutes(distKm: number): number {
  const speed = distKm < 8 ? 36 : distKm < 30 ? 55 : 78;
  return Math.max(1, Math.round((distKm / speed) * 60));
}

export interface JoCity {
  id: string;
  nameEn: string;
  nameAr: string;
  lat: number;
  lng: number;
}

/** Trip-planner origin/destination presets across Jordan. */
export const JO_CITIES: JoCity[] = [
  { id: "amman", nameEn: "Amman", nameAr: "عمّان", lat: 31.9539, lng: 35.9106 },
  { id: "zarqa", nameEn: "Zarqa", nameAr: "الزرقاء", lat: 32.0728, lng: 36.0876 },
  { id: "irbid", nameEn: "Irbid", nameAr: "إربد", lat: 32.5556, lng: 35.85 },
  { id: "salt", nameEn: "As-Salt", nameAr: "السلط", lat: 32.0392, lng: 35.7272 },
  { id: "madaba", nameEn: "Madaba", nameAr: "مأدبا", lat: 31.7157, lng: 35.7956 },
  { id: "jerash", nameEn: "Jerash", nameAr: "جرش", lat: 32.2723, lng: 35.8914 },
  { id: "ajloun", nameEn: "Ajloun", nameAr: "عجلون", lat: 32.3326, lng: 35.7517 },
  { id: "mafraq", nameEn: "Mafraq", nameAr: "المفرق", lat: 32.3434, lng: 36.208 },
  { id: "karak", nameEn: "Karak", nameAr: "الكرك", lat: 31.1853, lng: 35.7048 },
  { id: "tafilah", nameEn: "Tafilah", nameAr: "الطفيلة", lat: 30.8375, lng: 35.6042 },
  { id: "maan", nameEn: "Ma'an", nameAr: "معان", lat: 30.1962, lng: 35.7341 },
  { id: "aqaba", nameEn: "Aqaba", nameAr: "العقبة", lat: 29.532, lng: 35.0063 },
  { id: "deadsea", nameEn: "Dead Sea (Sweimeh)", nameAr: "البحر الميت (السويمة)", lat: 31.7195, lng: 35.5883 },
  { id: "petra", nameEn: "Petra (Wadi Musa)", nameAr: "البترا (وادي موسى)", lat: 30.3215, lng: 35.4787 },
  { id: "wadirum", nameEn: "Wadi Rum", nameAr: "وادي رم", lat: 29.5766, lng: 35.4208 },
  { id: "airport", nameEn: "Queen Alia Airport", nameAr: "مطار الملكة علياء", lat: 31.7226, lng: 35.9932 },
];
