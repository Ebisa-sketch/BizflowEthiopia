import { PaymentMethod } from "@prisma/client";

export interface PaymentReferenceValidationResult {
  isValid: boolean;
  normalizedReference: string;
  error?: string;
  provider: PaymentMethod;
  formatHint: string;
}

export interface ExtractedSmsReference {
  extractedReference: string;
  detectedProvider: PaymentMethod;
  extractedAmount?: number;
  rawMatchedSnippet?: string;
}

/**
 * Common fake, placeholder, or generic strings used inappropriately as payment references.
 */
const BLACKLISTED_REFERENCES = new Set([
  "000000",
  "0000000",
  "00000000",
  "000000000",
  "0000000000",
  "123456",
  "1234567",
  "12345678",
  "123456789",
  "1234567890",
  "TELEBIRR",
  "CBEBIRR",
  "CBE_BIRR",
  "BANKTRANSFER",
  "TRANSFER",
  "BANK",
  "CASH",
  "PAID",
  "TEST",
  "TEST1234",
  "NONE",
  "NULL",
  "UNDEFINED",
  "SAMPLE",
  "SAMPLE123",
  "PENDING",
  "SUCCESS",
  "OK",
  "YES",
  "NO",
]);

/**
 * Normalizes payment reference by trimming and converting to uppercase.
 */
export function normalizePaymentReference(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/\s+/g, " ");
}

/**
 * Strips whitespace, hyphens, and underscores for canonical checks (e.g. duplicate or blacklist check).
 */
export function canonicalizeReference(raw: string | null | undefined): string {
  if (!raw) return "";
  return raw.trim().toUpperCase().replace(/[\s\-_]/g, "");
}

/**
 * Checks if a string consists entirely of the same repeated character (e.g. "AAAAAAA" or "111111").
 */
function isRepeatedChar(str: string): boolean {
  if (str.length < 3) return false;
  return str.split("").every((ch) => ch === str[0]);
}

/**
 * Returns the format recommendation string for the given payment method.
 */
export function getPaymentFormatHint(method: PaymentMethod): string {
  switch (method) {
    case PaymentMethod.TELEBIRR:
      return "e.g. TB2410279184 or PB8821940 (6-25 characters)";
    case PaymentMethod.CBE_BIRR:
      return "e.g. FT2430198214 or CBE-991204 (6-25 characters)";
    case PaymentMethod.BANK_TRANSFER:
      return "e.g. AWASH-892104 or TXN-449102 (6-32 characters)";
    case PaymentMethod.OTHER:
      return "e.g. Customer credit agreement / memo (min. 3 characters)";
    case PaymentMethod.CASH:
    default:
      return "";
  }
}

/**
 * Validates the format and authenticity characteristics of an Ethiopian payment reference.
 */
export function validatePaymentReference(
  method: PaymentMethod,
  rawReference: string | null | undefined
): PaymentReferenceValidationResult {
  const normalized = normalizePaymentReference(rawReference);
  const canonical = canonicalizeReference(rawReference);
  const formatHint = getPaymentFormatHint(method);

  // Cash does not require any reference
  if (method === PaymentMethod.CASH) {
    return {
      isValid: true,
      normalizedReference: normalized,
      provider: method,
      formatHint,
    };
  }

  // Store credit / Other
  if (method === PaymentMethod.OTHER) {
    if (!normalized || normalized.length < 3) {
      return {
        isValid: false,
        normalizedReference: normalized,
        error: "Store Credit memo or reference note is required (minimum 3 characters).",
        provider: method,
        formatHint,
      };
    }
    if (normalized.length > 200) {
      return {
        isValid: false,
        normalizedReference: normalized,
        error: "Store Credit memo cannot exceed 200 characters.",
        provider: method,
        formatHint,
      };
    }
    return {
      isValid: true,
      normalizedReference: normalized,
      provider: method,
      formatHint,
    };
  }

  // Friendly method label for user messages
  const methodLabel =
    method === PaymentMethod.TELEBIRR
      ? "Telebirr"
      : method === PaymentMethod.CBE_BIRR
      ? "CBE Birr"
      : method === PaymentMethod.BANK_TRANSFER
      ? "bank transfer"
      : method;

  // All electronic methods require a non-empty reference
  if (!normalized || normalized.length < 3) {
    return {
      isValid: false,
      normalizedReference: normalized,
      error: `A valid transaction confirmation reference is required for ${methodLabel} payment.`,
      provider: method,
      formatHint,
    };
  }

  // Check against blacklisted placeholder strings
  if (BLACKLISTED_REFERENCES.has(canonical) || isRepeatedChar(canonical)) {
    return {
      isValid: false,
      normalizedReference: normalized,
      error: `Please enter the actual ${methodLabel} confirmation reference code from the transaction SMS or receipt, not a placeholder.`,
      provider: method,
      formatHint,
    };
  }

  // Validate allowed characters (letters, numbers, hyphens)
  const allowedCharsRegex = /^[A-Z0-9\-_]+$/;
  if (!allowedCharsRegex.test(normalized.replace(/\s+/g, ""))) {
    return {
      isValid: false,
      normalizedReference: normalized,
      error: `${methodLabel} reference can only contain letters, numbers, and hyphens.`,
      provider: method,
      formatHint,
    };
  }

  // Specific Provider Length & Characteristic Validations
  switch (method) {
    case PaymentMethod.TELEBIRR: {
      if (canonical.length < 6) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "Telebirr transaction confirmation reference must be at least 6 characters (e.g. TB2410279184).",
          provider: method,
          formatHint,
        };
      }
      if (canonical.length > 25) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "Telebirr reference cannot exceed 25 characters.",
          provider: method,
          formatHint,
        };
      }
      return {
        isValid: true,
        normalizedReference: normalized,
        provider: method,
        formatHint,
      };
    }

    case PaymentMethod.CBE_BIRR: {
      if (canonical.length < 6) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "CBE transaction confirmation reference must be at least 6 characters (e.g. FT2430198214 or CBE-991204).",
          provider: method,
          formatHint,
        };
      }
      if (canonical.length > 25) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "CBE reference cannot exceed 25 characters.",
          provider: method,
          formatHint,
        };
      }
      return {
        isValid: true,
        normalizedReference: normalized,
        provider: method,
        formatHint,
      };
    }

    case PaymentMethod.BANK_TRANSFER: {
      if (canonical.length < 6) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "Bank transfer reference must be at least 6 characters (e.g. AWASH-892104).",
          provider: method,
          formatHint,
        };
      }
      if (canonical.length > 32) {
        return {
          isValid: false,
          normalizedReference: normalized,
          error: "Bank transfer reference cannot exceed 32 characters.",
          provider: method,
          formatHint,
        };
      }
      return {
        isValid: true,
        normalizedReference: normalized,
        provider: method,
        formatHint,
      };
    }

    default:
      return {
        isValid: true,
        normalizedReference: normalized,
        provider: method,
        formatHint,
      };
  }
}

/**
 * Parses raw SMS text (pasted from mobile confirmation messages) to automatically extract
 * the transaction confirmation code and payment provider.
 */
export function extractPaymentReferenceFromSms(smsText: string): ExtractedSmsReference | null {
  if (!smsText || typeof smsText !== "string") return null;
  const cleaned = smsText.trim();
  if (cleaned.length < 5) return null;

  // Detect payment provider from text clues
  const lower = cleaned.toLowerCase();
  let detectedProvider: PaymentMethod = PaymentMethod.TELEBIRR;

  if (
    lower.includes("cbe") ||
    lower.includes("commercial bank") ||
    lower.includes("የኢትዮጵያ ንግድ ባንክ") ||
    lower.includes("ንግድ ባንክ")
  ) {
    detectedProvider = PaymentMethod.CBE_BIRR;
  } else if (
    lower.includes("awash") ||
    lower.includes("dashen") ||
    lower.includes("amole") ||
    lower.includes("abyssinia") ||
    lower.includes("sinqee") ||
    lower.includes("coop") ||
    lower.includes("oromia") ||
    lower.includes("bank")
  ) {
    detectedProvider = PaymentMethod.BANK_TRANSFER;
  } else if (lower.includes("telebirr") || lower.includes("ቴሌብር") || lower.includes("ethio telecom")) {
    detectedProvider = PaymentMethod.TELEBIRR;
  }

  // Regex patterns to match labeled references
  // Handles English & Amharic SMS formats
  const labeledRegexes = [
    // Telebirr / CBE English: "Transaction ID: TB2410279821" or "Txn Ref: FT2430188921"
    /(?:transaction\s*(?:id|no|num|number)?|txn\s*(?:id|ref|no)?|trans\s*(?:id|no)?|ref(?:\s*no)?|reference(?:\s*no)?|slip(?:\s*no)?)\s*[:፡\-]?\s*([A-Za-z0-9\-]{6,25})/i,
    // Amharic: "የግብይት ቁጥር፡ TB2410279821" or "የማጣቀሻ ቁጥር፡ FT2430188921" or "የትራንዛክሽን ቁጥር: TB..."
    /(?:የግብይት\s*(?:ቁጥር|መለያ\s*ቁጥር)?|የማጣቀሻ\s*ቁጥር|የትራንዛክሽን\s*ቁጥር)\s*[:፡\-]?\s*([A-Za-z0-9\-]{6,25})/i,
  ];

  for (const regex of labeledRegexes) {
    const match = cleaned.match(regex);
    if (match && match[1]) {
      const code = normalizePaymentReference(match[1]);
      if (code.length >= 6 && !BLACKLISTED_REFERENCES.has(canonicalizeReference(code))) {
        // Refine provider if code has a distinctive prefix
        if (code.startsWith("FT")) {
          detectedProvider = PaymentMethod.CBE_BIRR;
        } else if (code.startsWith("TB") || code.startsWith("PB")) {
          detectedProvider = PaymentMethod.TELEBIRR;
        }

        return {
          extractedReference: code,
          detectedProvider,
          rawMatchedSnippet: match[0],
        };
      }
    }
  }

  // Fallback: search for standalone characteristic codes like TB... or FT...
  const tbMatch = cleaned.match(/\b(TB[A-Za-z0-9]{6,20})\b/i);
  if (tbMatch && tbMatch[1]) {
    return {
      extractedReference: normalizePaymentReference(tbMatch[1]),
      detectedProvider: PaymentMethod.TELEBIRR,
      rawMatchedSnippet: tbMatch[0],
    };
  }

  const ftMatch = cleaned.match(/\b(FT[A-Za-z0-9]{6,20})\b/i);
  if (ftMatch && ftMatch[1]) {
    return {
      extractedReference: normalizePaymentReference(ftMatch[1]),
      detectedProvider: PaymentMethod.CBE_BIRR,
      rawMatchedSnippet: ftMatch[0],
    };
  }

  return null;
}
