import { describe, it, expect } from "vitest";
import { PaymentMethod } from "@prisma/client";
import {
  validatePaymentReference,
  normalizePaymentReference,
  canonicalizeReference,
  extractPaymentReferenceFromSms,
  getPaymentFormatHint,
} from "@/lib/payments/ethiopian-payment-reference";

describe("Ethiopian Payment Reference Validation Suite", () => {
  describe("Normalization & Canonicalization", () => {
    it("trims and uppercases input", () => {
      expect(normalizePaymentReference("  tb2410279821  ")).toBe("TB2410279821");
      expect(normalizePaymentReference("ft-2024-998811")).toBe("FT-2024-998811");
    });

    it("strips whitespace and dashes for canonical checking", () => {
      expect(canonicalizeReference("TB-2410-279821")).toBe("TB2410279821");
      expect(canonicalizeReference("  ft 2024 998811  ")).toBe("FT2024998811");
    });

    it("handles null and undefined gracefully", () => {
      expect(normalizePaymentReference(null)).toBe("");
      expect(normalizePaymentReference(undefined)).toBe("");
      expect(canonicalizeReference(null)).toBe("");
    });
  });

  describe("Telebirr Reference Validation", () => {
    it("accepts valid Telebirr references", () => {
      const validCases = [
        "TB2410279184",
        "TB-REC-89217342",
        "PB88219401",
        "TR92810024",
        "CI24109921",
        "BW24108842",
      ];

      for (const ref of validCases) {
        const result = validatePaymentReference(PaymentMethod.TELEBIRR, ref);
        expect(result.isValid, `Failed for ${ref}`).toBe(true);
        expect(result.error).toBeUndefined();
      }
    });

    it("rejects empty or too short Telebirr references", () => {
      const emptyResult = validatePaymentReference(PaymentMethod.TELEBIRR, "");
      expect(emptyResult.isValid).toBe(false);
      expect(emptyResult.error).toMatch(/transaction confirmation reference is required/i);

      const shortResult = validatePaymentReference(PaymentMethod.TELEBIRR, "TB12");
      expect(shortResult.isValid).toBe(false);
      expect(shortResult.error).toMatch(/at least 6 characters/i);
    });

    it("rejects placeholder and blacklisted values", () => {
      const badCases = ["123456", "TELEBIRR", "00000000", "test", "PAID", "AAAAAAA", "11111111"];
      for (const bad of badCases) {
        const res = validatePaymentReference(PaymentMethod.TELEBIRR, bad);
        expect(res.isValid, `Should have rejected: ${bad}`).toBe(false);
        expect(res.error).toMatch(/actual .* confirmation reference code/i);
      }
    });

    it("rejects invalid characters (emojis, punctuation other than hyphens)", () => {
      const res = validatePaymentReference(PaymentMethod.TELEBIRR, "TB2410@$#!");
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/only contain letters, numbers, and hyphens/i);
    });
  });

  describe("CBE Birr & Mobile Banking Reference Validation", () => {
    it("accepts valid CBE references", () => {
      const validCases = [
        "FT2430198214",
        "FT-24301-98214",
        "CBE-99120488",
        "MB241088194",
        "10009823412",
      ];

      for (const ref of validCases) {
        const result = validatePaymentReference(PaymentMethod.CBE_BIRR, ref);
        expect(result.isValid, `Failed for ${ref}`).toBe(true);
      }
    });

    it("rejects empty or blacklisted CBE references", () => {
      const emptyResult = validatePaymentReference(PaymentMethod.CBE_BIRR, "   ");
      expect(emptyResult.isValid).toBe(false);

      const blacklisted = validatePaymentReference(PaymentMethod.CBE_BIRR, "CBEBIRR");
      expect(blacklisted.isValid).toBe(false);
      expect(blacklisted.error).toMatch(/actual .* confirmation reference code/i);
    });
  });

  describe("Bank Transfer Reference Validation", () => {
    it("accepts valid bank transfer reference and slip numbers", () => {
      const validCases = ["AWASH-892104", "DASHEN449102", "BOA-772183", "SINQEE89214"];
      for (const ref of validCases) {
        const res = validatePaymentReference(PaymentMethod.BANK_TRANSFER, ref);
        expect(res.isValid).toBe(true);
      }
    });

    it("rejects generic placeholder strings", () => {
      const res = validatePaymentReference(PaymentMethod.BANK_TRANSFER, "TRANSFER");
      expect(res.isValid).toBe(false);
      expect(res.error).toMatch(/actual bank transfer confirmation/i);
    });
  });

  describe("Cash & Store Credit Validation", () => {
    it("allows Cash with null, undefined, or empty reference", () => {
      expect(validatePaymentReference(PaymentMethod.CASH, null).isValid).toBe(true);
      expect(validatePaymentReference(PaymentMethod.CASH, "").isValid).toBe(true);
    });

    it("validates Store Credit (OTHER) minimum memo length", () => {
      const tooShort = validatePaymentReference(PaymentMethod.OTHER, "NO");
      expect(tooShort.isValid).toBe(false);
      expect(tooShort.error).toMatch(/minimum 3 characters/i);

      const validMemo = validatePaymentReference(
        PaymentMethod.OTHER,
        "IDDA: Store Credit - Kebede Tadesse"
      );
      expect(validMemo.isValid).toBe(true);
    });
  });

  describe("Smart SMS Reference Extractor", () => {
    it("extracts Telebirr reference from English SMS", () => {
      const sms =
        "Dear customer, you have received ETB 450.00 from ABEBE TESFAYE (251911223344). Transaction ID: TB2410279821. Completed at 2026-10-27 15:30.";
      const extracted = extractPaymentReferenceFromSms(sms);

      expect(extracted).not.toBeNull();
      expect(extracted?.extractedReference).toBe("TB2410279821");
      expect(extracted?.detectedProvider).toBe(PaymentMethod.TELEBIRR);
    });

    it("extracts Telebirr reference from Amharic SMS", () => {
      const sms = "ውድ ደንበኛችን ከ 0911223344 850.00 ብር ገቢ ሆኗል። የግብይት ቁጥር፡ TB88219401 ነው።";
      const extracted = extractPaymentReferenceFromSms(sms);

      expect(extracted).not.toBeNull();
      expect(extracted?.extractedReference).toBe("TB88219401");
      expect(extracted?.detectedProvider).toBe(PaymentMethod.TELEBIRR);
    });

    it("extracts CBE reference from CBE Mobile Banking SMS", () => {
      const sms =
        "Dear Customer, ETB 1,200.00 has been credited to your CBE account from Desta B. Txn Ref: FT24301889214. Date: 27-OCT-2026.";
      const extracted = extractPaymentReferenceFromSms(sms);

      expect(extracted).not.toBeNull();
      expect(extracted?.extractedReference).toBe("FT24301889214");
      expect(extracted?.detectedProvider).toBe(PaymentMethod.CBE_BIRR);
    });

    it("extracts standalone Telebirr code without labels", () => {
      const sms = "Payment confirmed TB2410278891 for your order.";
      const extracted = extractPaymentReferenceFromSms(sms);

      expect(extracted).not.toBeNull();
      expect(extracted?.extractedReference).toBe("TB2410278891");
      expect(extracted?.detectedProvider).toBe(PaymentMethod.TELEBIRR);
    });

    it("returns null for non-payment messages", () => {
      expect(extractPaymentReferenceFromSms("Hello, how are you today?")).toBeNull();
      expect(extractPaymentReferenceFromSms("")).toBeNull();
    });
  });

  describe("Format Hints", () => {
    it("provides helpful hints for all payment methods", () => {
      expect(getPaymentFormatHint(PaymentMethod.TELEBIRR)).toMatch(/TB2410279184/);
      expect(getPaymentFormatHint(PaymentMethod.CBE_BIRR)).toMatch(/FT2430198214/);
      expect(getPaymentFormatHint(PaymentMethod.BANK_TRANSFER)).toMatch(/AWASH/);
    });
  });
});
