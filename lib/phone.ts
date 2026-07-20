/**
 * Jordanian mobile number normalization. Accepts common local formats
 * and returns E.164 (+9627XXXXXXXX), or null when not a valid JO mobile.
 */
export function normalizeJordanPhone(input: string): string | null {
  const digits = input.replace(/[\s\-()]/g, "");
  let rest: string | null = null;

  if (/^\+9627\d{8}$/.test(digits)) rest = digits.slice(4);
  else if (/^009627\d{8}$/.test(digits)) rest = digits.slice(5);
  else if (/^9627\d{8}$/.test(digits)) rest = digits.slice(3);
  else if (/^07\d{8}$/.test(digits)) rest = digits.slice(1);

  if (!rest) return null;
  // JO mobile prefixes: 77 / 78 / 79
  if (!/^7[789]\d{7}$/.test(rest)) return null;
  return `+962${rest}`;
}

/** True when the string looks like a phone attempt (vs. an email). */
export function looksLikePhone(input: string): boolean {
  return /^[\d\s\-+()]+$/.test(input.trim());
}
