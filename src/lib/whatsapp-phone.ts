/**
 * Universal Customer & Donor WhatsApp Phone Normalization Utility
 * Strictly guarantees Indian numbers are parsed to the exact 10 subscriber digits
 * and formatted for WhatsApp wa.me, Baileys JID, and Meta Cloud API.
 */

export interface CustomerPhoneInfo {
  raw: string;
  last10: string;
  waNumber: string; // "919980123456" for wa.me/919980123456
  e164: string;     // "+919980123456"
  display: string;  // "+91 99801 23456"
  jid: string;      // "919980123456@s.whatsapp.net"
  isValid: boolean;
}

export function parseCustomerPhone(rawPhone: string): CustomerPhoneInfo {
  if (!rawPhone || typeof rawPhone !== "string") {
    return {
      raw: "",
      last10: "",
      waNumber: "",
      e164: "",
      display: "Invalid Phone",
      jid: "",
      isValid: false,
    };
  }

  const digits = rawPhone.replace(/\D/g, "");
  const last10 = digits.length >= 10 ? digits.slice(-10) : digits;
  const isValid = last10.length === 10;
  const waNumber = `91${last10}`;
  const e164 = `+91${last10}`;
  const display = last10.length === 10
    ? `+91 ${last10.slice(0, 5)} ${last10.slice(5)}`
    : rawPhone;
  const jid = `${waNumber}@s.whatsapp.net`;

  return {
    raw: rawPhone,
    last10,
    waNumber,
    e164,
    display,
    jid,
    isValid,
  };
}
