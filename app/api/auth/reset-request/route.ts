import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeJordanPhone } from "@/lib/phone";
import { sendAdminEmail } from "@/lib/mail";

export const dynamic = "force-dynamic";

/**
 * Public "forgot my password" request from the login screen. Stores the
 * request for the admin and notifies them by email (when configured).
 * Always returns ok so it never reveals whether a number has an account.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const name = String(body?.name ?? "").trim();
  const phone = normalizeJordanPhone(String(body?.phone ?? ""));
  if (!name || !phone) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { phone }, select: { id: true } });

  // avoid piling up duplicate open requests for the same number
  const existing = await prisma.passwordResetRequest.findFirst({
    where: { phone, status: "OPEN" },
  });
  if (!existing) {
    await prisma.passwordResetRequest.create({
      data: { name, phone, userId: user?.id ?? null },
    });
    await sendAdminEmail(
      "Eshhan — password reset request",
      `<div style="font-family:sans-serif">
        <h2 style="color:#1B7A4B">Password reset request</h2>
        <p>A user has asked to reset their password:</p>
        <ul>
          <li><b>Name:</b> ${name}</li>
          <li><b>Phone:</b> ${phone}</li>
          <li><b>Account found:</b> ${user ? "yes" : "no matching account"}</li>
        </ul>
        <p>Open the admin panel → Users to set a temporary password and send it to them.</p>
      </div>`
    );
  }

  return NextResponse.json({ ok: true });
}
