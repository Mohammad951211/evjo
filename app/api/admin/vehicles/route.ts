import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentAdminId } from "@/lib/session";

export const dynamic = "force-dynamic";

/** Catalog vehicles grouped by make + model, for photo management — admin only. */
export async function GET() {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const rows = await prisma.vehicle.findMany({
    orderBy: [{ make: "asc" }, { model: "asc" }, { yearFrom: "asc" }],
    select: { make: true, model: true, image: true },
  });

  // collapse to one entry per make+model
  const map = new Map<string, { make: string; model: string; image: string | null; variants: number }>();
  for (const r of rows) {
    const key = `${r.make}|||${r.model}`;
    const g = map.get(key);
    if (g) {
      g.variants++;
      if (!g.image && r.image) g.image = r.image;
    } else {
      map.set(key, { make: r.make, model: r.model, image: r.image ?? null, variants: 1 });
    }
  }
  return NextResponse.json({ models: Array.from(map.values()) });
}

/** Set (or clear) the photo for every variant of a make + model — admin only. */
export async function PATCH(req: Request) {
  const admin = await currentAdminId();
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const make = String(body?.make ?? "").trim();
  const model = String(body?.model ?? "").trim();
  if (!make || !model) return NextResponse.json({ error: "invalid" }, { status: 400 });

  let image: string | null = null;
  if (typeof body?.image === "string" && body.image.length > 0) {
    if (
      !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(body.image) ||
      body.image.length > 1_200_000
    ) {
      return NextResponse.json({ error: "bad_image" }, { status: 400 });
    }
    image = body.image;
  }

  const res = await prisma.vehicle.updateMany({ where: { make, model }, data: { image } });
  return NextResponse.json({ ok: true, updated: res.count, image });
}
