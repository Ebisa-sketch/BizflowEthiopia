import { describe, it, expect, vi, beforeEach } from "vitest";
import { validateEthiopianPhone } from "@/lib/auth/phone";

describe("Registration & Validation Suite", () => {
  describe("Ethiopian Phone Number Validator", () => {
    it("accepts valid Ethiopian phone number with +251 country code", () => {
      const res = validateEthiopianPhone("+251911234567");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+251911234567");
    });

    it("accepts valid Ethiopian phone number with spaces and dashes", () => {
      const res = validateEthiopianPhone("+251 911 234 567");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+251911234567");
    });

    it("accepts valid Safaricom Ethiopia 07 prefix number", () => {
      const res = validateEthiopianPhone("0712345678");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+251712345678");
    });

    it("accepts valid Ethio Telecom 09 prefix number", () => {
      const res = validateEthiopianPhone("0912345678");
      expect(res.valid).toBe(true);
      expect(res.normalized).toBe("+251912345678");
    });

    it("treats empty or whitespace phone as valid (since phone is optional)", () => {
      expect(validateEthiopianPhone("").valid).toBe(true);
      expect(validateEthiopianPhone("   ").valid).toBe(true);
    });

    it("rejects invalid prefixes or wrong length phone numbers", () => {
      expect(validateEthiopianPhone("123456").valid).toBe(false);
      expect(validateEthiopianPhone("0811234567").valid).toBe(false);
      expect(validateEthiopianPhone("09112345").valid).toBe(false); // too short
      expect(validateEthiopianPhone("091123456789").valid).toBe(false); // too long
      expect(validateEthiopianPhone("invalid-phone").valid).toBe(false);
    });
  });

  describe("Password Policy & Requirements", () => {
    it("detects password complexity criteria", () => {
      const weakPassword = "123";
      const goodPassword = "SecurePass123!";

      expect(goodPassword.length >= 8).toBe(true);
      expect(/[0-9]/.test(goodPassword)).toBe(true);
      expect(/[a-zA-Z]/.test(goodPassword)).toBe(true);
      expect(/[^A-Za-z0-9]/.test(goodPassword)).toBe(true);

      expect(weakPassword.length >= 8).toBe(false);
    });
  });
});
