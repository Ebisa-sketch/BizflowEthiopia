/**
 * Ethiopian phone number validator helper.
 * Validates Ethio Telecom (09...) and Safaricom Ethiopia (07...) mobile numbers
 * with or without international country prefix (+251).
 */
export function validateEthiopianPhone(phone: string): {
  valid: boolean;
  normalized?: string;
  error?: string;
} {
  if (!phone || !phone.trim()) {
    return { valid: true };
  }
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  // Formats: +2519XXXXXXXX, +2517XXXXXXXX, 09XXXXXXXX, 07XXXXXXXX, 9XXXXXXXX, 7XXXXXXXX
  const ethRegex = /^(?:\+251|251|0)?([79]\d{8})$/;
  const match = cleaned.match(ethRegex);
  if (!match) {
    return {
      valid: false,
      error: "Please enter a valid Ethiopian phone number (e.g. +251 911 234 567 or 0911234567)",
    };
  }
  return {
    valid: true,
    normalized: `+251${match[1]}`,
  };
}
