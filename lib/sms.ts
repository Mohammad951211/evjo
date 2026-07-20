/**
 * SMS driver. Uses Twilio when TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN /
 * TWILIO_FROM are configured; otherwise logs the message so the OTP flow
 * stays fully testable in development without a gateway.
 */
export async function sendSms(
  to: string,
  body: string
): Promise<{ delivered: boolean }> {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_FROM;

  if (sid && token && from) {
    const res = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
      {
        method: "POST",
        headers: {
          Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ To: to, From: from, Body: body }),
      }
    );
    if (!res.ok) {
      console.error("Twilio send failed:", res.status, await res.text());
      return { delivered: false };
    }
    return { delivered: true };
  }

  console.log(`[SMS:dev] to=${to} body="${body}"`);
  return { delivered: false };
}

export function smsConfigured(): boolean {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
      process.env.TWILIO_AUTH_TOKEN &&
      process.env.TWILIO_FROM
  );
}

/**
 * Phone verification gate. OTP is required unless OTP_REQUIRED="false" —
 * the free-launch mode: accounts activate immediately on signup, and the
 * whole OTP flow re-arms by flipping the flag once an SMS gateway exists.
 */
export function otpRequired(): boolean {
  return process.env.OTP_REQUIRED !== "false";
}
