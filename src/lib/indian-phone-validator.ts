/**
 * Indian Mobile Phone Validation & Deep Junk Detection Engine
 * Based on ITU-T E.164 and Department of Telecommunications (DoT) National Numbering Plan (NNP).
 *
 * Rules:
 * 1. Must be an Indian Mobile number: exactly 10 digits starting with 6, 7, 8, or 9.
 * 2. Rejects landlines (starts with 1, 2, 3, 4, 5, e.g. 080 Bangalore landlines).
 * 3. Rejects toll-free / emergency (1800, 100, 112, 108).
 * 4. Filters out dummy/fake numbers:
 *    - All repeating digits (e.g. 9999999999, 8888888888, 0000000000)
 *    - Sequential ascending/descending digits (e.g. 9876543210, 1234567890, 0123456789)
 *    - Repetitive 2-digit patterns (e.g. 9898989898, 9191919191, 9090909090)
 *    - Low entropy: fewer than 4 unique digits (e.g. 9888888888, 9000000009)
 *    - Common keyboard mash dummy sequences
 */

export interface PhoneValidationResult {
  isValid: boolean;
  phone10: string;
  e164: string;
  isJunk: boolean;
  reason?: string;
}

// Known common fake/dummy sequences entered by users
const KNOWN_DUMMY_SEQUENCES = new Set([
  "9876543210",
  "9876543211",
  "9876543212",
  "9123456789",
  "8901234567",
  "7890123456",
  "6789012345",
  "1234567890",
  "0123456789",
  "9000000000",
  "9900000000",
  "9990000000",
  "9845000000",
  "9800000000",
  "9012345678",
  "8901234567",
]);

/**
 * Normalizes any raw phone input to clean 10-digit Indian mobile format
 */
export function normalizeIndianMobile(raw: any): string {
  if (raw == null) return "";
  let str = String(raw).trim();

  // Handle scientific notation e.g. 9.63221E+09
  if (/^[+-]?\d+(\.\d+)?[eE][+-]?\d+$/.test(str)) {
    try {
      const num = Number(str);
      if (!isNaN(num)) {
        str = BigInt(Math.round(num)).toString();
      }
    } catch {}
  }

  // Strip all non-digit characters
  const digits = str.replace(/\D/g, "");

  // If 11 digits starting with 0:
  // e.g. 09845012345 (mobile with leading 0) -> 9845012345
  // but if 08026781234 (Bangalore landline) or 01123456789 (Delhi landline) -> return 11 digits so validator rejects it
  if (digits.length === 11 && digits.startsWith("0")) {
    const secondDigit = digits[1];
    // If second digit is NOT in 6, 7, 8, 9, it is an STD landline
    if (!["6", "7", "8", "9"].includes(secondDigit)) {
      return digits; // keep full 11 digits so validator rejects as landline
    }
    // If it starts with 080 and next digit is 2, 3, 4, 5, 6, 7, it's Bangalore landline
    if (digits.startsWith("080") && ["2", "3", "4", "5", "6", "7"].includes(digits[3])) {
      return digits;
    }
    // Genuine mobile with leading 0 (e.g. 09845012345)
    return digits.slice(1);
  }

  // Strip country prefix 91 (e.g. +91 9845012345)
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length >= 10) return digits.slice(-10);

  return digits;
}

/**
 * Validates whether a phone number is a genuine Indian Mobile number,
 * rejecting landlines, incomplete numbers, and fake/junk dummy numbers.
 */
export function validateIndianMobile(raw: any): PhoneValidationResult {
  const phone10 = normalizeIndianMobile(raw);

  // 1. Length Check
  if (phone10.length !== 10) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: `Invalid length (${phone10.length} digits, must be exactly 10)`,
    };
  }

  // 2. DoT Mobile Prefix Check: India mobile numbers MUST start with 6, 7, 8, or 9
  const firstDigit = phone10[0];
  if (!["6", "7", "8", "9"].includes(firstDigit)) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: `Non-mobile prefix (${firstDigit}xxxxxxxxx - landlines or invalid series)`,
    };
  }

  // 2b. STD Landline disguised as 10 digits (e.g. 802xxxxxxx, 803xxxxxxx - Bangalore 080 landlines missing 0)
  if (/^80[2-7]\d{7}$/.test(phone10)) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "Bangalore landline (080-2/3/4/5/6/7 series)",
    };
  }

  // Ahmedabad landlines missing leading 0 (079-2/3/4/5/6 series)
  if (/^79[2-6]\d{7}$/.test(phone10)) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "Ahmedabad landline (079 series)",
    };
  }

  // 3. Known Dummy Sequence Check
  if (KNOWN_DUMMY_SEQUENCES.has(phone10)) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "Common dummy/placeholder number",
    };
  }

  // 4. All Repeating Digits Check (e.g. 9999999999, 8888888888)
  const isAllSame = /^(\d)\1{9}$/.test(phone10);
  if (isAllSame) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "All identical repeating digits",
    };
  }

  // 5. Unique Digits (Entropy) Check: Genuine mobile numbers have at least 4 unique digits
  const uniqueDigits = new Set(phone10.split(""));
  if (uniqueDigits.size < 4) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: `Low entropy dummy pattern (${uniqueDigits.size} unique digits)`,
    };
  }

  // 6. Repetitive 2-digit patterns (e.g. 9898989898, 9191919191, 9090909090, 7676767676)
  const isPairRepetitive = /^(\d{2})\1{4}$/.test(phone10);
  if (isPairRepetitive) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "Repetitive 2-digit pattern",
    };
  }

  // 7. Repetitive 3-digit patterns (e.g. 9879879879)
  const isTripleRepetitive = /^(\d{3})\1{2}\d$/.test(phone10);
  if (isTripleRepetitive) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "Repetitive 3-digit sequence",
    };
  }

  // 8. 6+ Consecutive Repeating Digits (e.g. 9877777777, 9899999999)
  if (/(\d)\1{5,}/.test(phone10)) {
    return {
      isValid: false,
      phone10,
      e164: "",
      isJunk: true,
      reason: "6+ consecutive repeated digits",
    };
  }

  // All checks passed -> Genuine Indian Mobile Number
  return {
    isValid: true,
    phone10,
    e164: `+91${phone10}`,
    isJunk: false,
  };
}
