import { describe, it, expect } from "vitest";
import { normalizeJordanPhone, looksLikePhone } from "@/lib/phone";

describe("normalizeJordanPhone", () => {
  it("normalizes the local 07 format to E.164", () => {
    expect(normalizeJordanPhone("0791234567")).toBe("+962791234567");
    expect(normalizeJordanPhone("0781234567")).toBe("+962781234567");
    expect(normalizeJordanPhone("0771234567")).toBe("+962771234567");
  });

  it("accepts the +962, 00962 and 962 international forms", () => {
    expect(normalizeJordanPhone("+962791234567")).toBe("+962791234567");
    expect(normalizeJordanPhone("00962791234567")).toBe("+962791234567");
    expect(normalizeJordanPhone("962791234567")).toBe("+962791234567");
  });

  it("strips spaces, dashes and parentheses", () => {
    expect(normalizeJordanPhone("079 123 4567")).toBe("+962791234567");
    expect(normalizeJordanPhone("079-123-4567")).toBe("+962791234567");
    expect(normalizeJordanPhone("(079) 123 4567")).toBe("+962791234567");
  });

  it("rejects non-mobile prefixes (only 77/78/79 are valid)", () => {
    expect(normalizeJordanPhone("0761234567")).toBeNull();
    expect(normalizeJordanPhone("0701234567")).toBeNull();
    expect(normalizeJordanPhone("0612345678")).toBeNull();
  });

  it("rejects wrong lengths and junk", () => {
    expect(normalizeJordanPhone("079123456")).toBeNull(); // too short
    expect(normalizeJordanPhone("07912345678")).toBeNull(); // too long
    expect(normalizeJordanPhone("")).toBeNull();
    expect(normalizeJordanPhone("not a phone")).toBeNull();
    expect(normalizeJordanPhone("+1234567890")).toBeNull();
  });
});

describe("looksLikePhone", () => {
  it("distinguishes phone-shaped input from emails", () => {
    expect(looksLikePhone("0791234567")).toBe(true);
    expect(looksLikePhone("+962 79 123 4567")).toBe(true);
    expect(looksLikePhone("user@example.com")).toBe(false);
  });
});
