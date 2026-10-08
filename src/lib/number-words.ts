/**
 * Convert numbers to Indian Rupees in words (e.g., 4500 -> "Four Thousand Five Hundred Rupees Only")
 * Matches the format expected on Indian charitable receipts and paper forms.
 */
export function numberToIndianWords(amount: number): string {
  const n = Math.floor(amount);
  if (!Number.isFinite(n) || n <= 0) return "Zero Rupees Only";

  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];

  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  function convertTwoDigits(num: number): string {
    if (num < 20) return ones[num];
    const t = tens[Math.floor(num / 10)];
    const o = ones[num % 10];
    return t + (o ? ` ${o}` : "");
  }

  function convertThreeDigits(num: number): string {
    const h = Math.floor(num / 100);
    const r = num % 100;
    const hStr = h > 0 ? `${ones[h]} Hundred` : "";
    const rStr = r > 0 ? convertTwoDigits(r) : "";
    if (hStr && rStr) return `${hStr} ${rStr}`;
    return hStr || rStr;
  }

  const crores = Math.floor(n / 10000000);
  const lakhs = Math.floor((n % 10000000) / 100000);
  const thousands = Math.floor((n % 100000) / 1000);
  const remainder = n % 1000;

  const parts: string[] = [];
  if (crores > 0) parts.push(`${convertTwoDigits(crores)} Crore`);
  if (lakhs > 0) parts.push(`${convertTwoDigits(lakhs)} Lakh`);
  if (thousands > 0) parts.push(`${convertTwoDigits(thousands)} Thousand`);
  if (remainder > 0) parts.push(convertThreeDigits(remainder));

  return `${parts.join(" ")} Rupees Only`.trim();
}
