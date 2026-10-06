/**
 * Centralized Form & Input Validation Library
 * Janaseva Ashrama Management Suite & Public Giving Portal
 */

// Indian Permanent Account Number (PAN) format: 5 letters, 4 digits, 1 letter (e.g. ABCDE1234F)
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

// Standard email format
export const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

// Names: Letters, spaces, hyphens, periods, apostrophes (at least 2 alphabetic letters)
export const NAME_REGEX = /^[a-zA-Z\s.'-]{2,100}$/;

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a person's or contact's name.
 * Disallows numbers, symbols, and empty/single-letter strings.
 */
export function validateName(value: string, fieldLabel = "Name"): ValidationResult {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldLabel} is required.` };
  }
  if (trimmed.length < 2) {
    return { valid: false, error: `${fieldLabel} must be at least 2 characters long.` };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: `${fieldLabel} cannot exceed 100 characters.` };
  }
  if (!NAME_REGEX.test(trimmed) || !/[a-zA-Z].*[a-zA-Z]/.test(trimmed)) {
    return {
      valid: false,
      error: `${fieldLabel} should contain letters only (no numbers or special symbols).`,
    };
  }
  return { valid: true };
}

/**
 * Validates an email address.
 */
export function validateEmail(value: string, required = true): ValidationResult {
  const trimmed = (value || "").trim().toLowerCase();
  if (!trimmed) {
    if (required) return { valid: false, error: "Email address is required." };
    return { valid: true };
  }
  if (trimmed.length > 254 || !EMAIL_REGEX.test(trimmed)) {
    return { valid: false, error: "Please enter a valid email address (e.g. name@example.com)." };
  }
  return { valid: true };
}

/**
 * Validates a mobile / phone number.
 * Ensures numbers only, 10 digits for Indian numbers, or 10-15 digits with international prefix.
 */
export function validatePhone(value: string, required = false, fieldLabel = "Mobile number"): ValidationResult {
  const raw = (value || "").trim();
  if (!raw) {
    if (required) return { valid: false, error: `${fieldLabel} is required.` };
    return { valid: true };
  }

  // Check if non-digits were entered (apart from optional leading +)
  const digitsOnly = raw.replace(/[^\d]/g, "");
  if (!/^\+?\d+$/.test(raw.replace(/[\s-]/g, ""))) {
    return { valid: false, error: `${fieldLabel} must contain numbers only.` };
  }

  // Check length: Indian standard 10 digits, or 10-15 digits
  if (digitsOnly.length < 10) {
    return { valid: false, error: `Please enter a complete 10-digit ${fieldLabel.toLowerCase()}.` };
  }
  if (digitsOnly.length > 15) {
    return { valid: false, error: `${fieldLabel} cannot exceed 15 digits.` };
  }

  // If 10 digits (India), check starting digit (6, 7, 8, 9)
  if (digitsOnly.length === 10 && !/^[6-9]\d{9}$/.test(digitsOnly)) {
    return {
      valid: false,
      error: `Please enter a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.`,
    };
  }

  return { valid: true };
}

/**
 * Validates an Indian Income Tax PAN Card Number.
 * 10 alphanumeric characters: 5 uppercase letters, 4 digits, 1 uppercase letter.
 */
export function validatePan(value: string, required = false): ValidationResult {
  const cleanPan = (value || "").trim().toUpperCase();
  if (!cleanPan) {
    if (required) return { valid: false, error: "PAN number is required for 80G tax exemption." };
    return { valid: true };
  }

  if (cleanPan.length !== 10) {
    return {
      valid: false,
      error: "PAN number must be exactly 10 characters long (e.g. ABCDE1234F).",
    };
  }

  if (!PAN_REGEX.test(cleanPan)) {
    return {
      valid: false,
      error: "Invalid PAN card format. Standard format is 5 letters, 4 numbers, and 1 letter (e.g. ABCDE1234F).",
    };
  }

  return { valid: true };
}

/**
 * Validates monetary amounts.
 */
export function validateAmount(value: number | string, min = 10, max = 10000000): ValidationResult {
  const num = typeof value === "number" ? value : Number(value);
  if (isNaN(num) || num <= 0) {
    return { valid: false, error: "Please enter a valid positive donation amount." };
  }
  if (num < min) {
    return { valid: false, error: `Minimum contribution amount is ₹${min.toLocaleString("en-IN")}.` };
  }
  if (num > max) {
    return { valid: false, error: `Maximum single contribution amount is ₹${max.toLocaleString("en-IN")}.` };
  }
  return { valid: true };
}

/**
 * Validates celebration / event date (must not be in the past).
 */
export function validateFutureDate(dateStr: string, fieldLabel = "Date"): ValidationResult {
  if (!dateStr || !dateStr.trim()) {
    return { valid: false, error: `Please select a ${fieldLabel.toLowerCase()}.` };
  }
  const dateObj = new Date(dateStr);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: `Please enter a valid ${fieldLabel.toLowerCase()}.` };
  }

  // Set today's date to midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Parse target date midnight
  const target = new Date(dateStr);
  target.setHours(0, 0, 0, 0);

  if (target < today) {
    return { valid: false, error: `${fieldLabel} cannot be in the past. Please select today or an upcoming date.` };
  }

  return { valid: true };
}

/**
 * Sanitizes input to numbers only.
 */
export function sanitizeNumeric(value: string): string {
  return (value || "").replace(/\D/g, "");
}

/**
 * Sanitizes input to uppercase alphanumeric PAN format.
 */
export function sanitizePan(value: string): string {
  return (value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 10);
}

/**
 * Sanitizes name input (removes digits and special characters except letters, spaces, hyphens, dots).
 */
export function sanitizeName(value: string): string {
  return (value || "").replace(/[^a-zA-Z\s.'-]/g, "");
}
