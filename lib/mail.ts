/**
 * Email driver. Uses Resend when RESEND_API_KEY + ADMIN_EMAIL are set;
 * otherwise logs the message so flows stay testable without a provider.
 * Resend free tier sends from onboarding@resend.dev with no domain setup.
 */
export async function sendAdminEmail(subject: string, html: string): Promise<{ sent: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.ADMIN_EMAIL;
  if (!key || !to) {
    console.log(`[mail:dev] to=${to ?? "(no ADMIN_EMAIL)"} subject="${subject}"`);
    return { sent: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || "Eshhan <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });
    if (!res.ok) {
      console.error("Resend send failed:", res.status, await res.text());
      return { sent: false };
    }
    return { sent: true };
  } catch (e) {
    console.error("Resend error:", e);
    return { sent: false };
  }
}
