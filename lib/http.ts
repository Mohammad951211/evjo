/**
 * fetch with an abort-based timeout. External providers (OpenChargeMap,
 * Overpass/OSM, Resend, Twilio) can hang or queue; without a timeout a slow
 * upstream would block the request until the platform hard-kills the function.
 */
export async function fetchWithTimeout(
  input: string | URL,
  init: RequestInit = {},
  timeoutMs = 10_000,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}
