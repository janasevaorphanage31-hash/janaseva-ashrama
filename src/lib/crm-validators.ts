/**
 * Client-safe CRM Validation Utilities
 * Zero dependencies on server-only packages (db, node modules, etc.)
 */

/**
 * Strict Indian UPI UTR & Bank Reference validation
 * Standard UPI UTR: 12 numeric digits (e.g. 428910284712)
 * IMPS/NEFT/RTGS: 12 to 22 alphanumeric characters
 */
export function validateIndianUtr(rawUtr?: string | null): { isValid: boolean; cleaned: string; error?: string } {
  if (!rawUtr || !rawUtr.trim()) {
    return { isValid: true, cleaned: "" };
  }
  const cleanUtr = rawUtr.trim().toUpperCase().replace(/[\s-]/g, "");

  // Pure digits: strictly 12 numeric digits for UPI UTRs (GPay, PhonePe, Paytm, BHIM)
  if (/^\d+$/.test(cleanUtr)) {
    if (cleanUtr.length === 12) {
      return { isValid: true, cleaned: cleanUtr };
    }
    return {
      isValid: false,
      cleaned: cleanUtr,
      error: `UPI UTR must be exactly 12 numeric digits (you entered ${cleanUtr.length} digits: '${cleanUtr}'). Please re-check the donor's GPay/PhonePe/Paytm receipt.`,
    };
  }

  // Alphanumeric with letters: Bank IMPS / NEFT / RTGS reference (12 - 22 chars)
  if (/^[A-Z0-9]{12,22}$/.test(cleanUtr) && /[A-Z]/.test(cleanUtr)) {
    return { isValid: true, cleaned: cleanUtr };
  }

  return {
    isValid: false,
    cleaned: cleanUtr,
    error: `Invalid UTR reference '${cleanUtr}'. Must be a 12-digit UPI UTR or 12-22 character bank reference (e.g. AXISN24089123456).`,
  };
}
