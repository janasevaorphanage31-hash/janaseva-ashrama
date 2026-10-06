import { NextResponse } from "next/server";
import { desc } from "drizzle-orm";
import { db } from "@/db";
import { donations, donationLines } from "@/db/schema";
import { requireAdminApi } from "@/lib/admin-auth";
import { writeAudit } from "@/lib/audit";
import { clientIp } from "@/lib/server-utils";

function escapeCsv(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Neutralize CSV formula injection (OWASP Top 10): prefix =, +, -, @, \t, \r with '
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

export async function GET(req: Request) {
  const session = await requireAdminApi(["SUPER_ADMIN", "STAFF_ADMIN", "FINANCE"]);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  await writeAudit({
    actorAdminUserId: session.user.id,
    action: "export_crm_donations",
    entity: "donations",
    ipAddress: clientIp(req),
  });

  const rows = await db
    .select()
    .from(donations)
    .orderBy(desc(donations.createdAt));

  const lines = await db.select().from(donationLines);
  const linesMap = lines.reduce<Record<number, string[]>>((acc, l) => {
    if (!l.donationId) return acc;
    if (!acc[l.donationId]) acc[l.donationId] = [];
    acc[l.donationId].push(`${l.label} (x${l.qty})`);
    return acc;
  }, {});

  const headers = [
    "ID",
    "Public Reference",
    "Receipt Number",
    "Date (IST)",
    "Status",
    "Donor Name",
    "Email",
    "Phone",
    "PAN (80G)",
    "Amount (INR)",
    "Payment Mode",
    "Razorpay Payment ID",
    "Occasion / Dedication",
    "Honoree Name",
    "Message",
    "Items Supported",
  ];

  const csvRows = [headers.join(",")];

  for (const d of rows) {
    const meta = (d.meta as any) || {};
    const dedication = meta.dedication || {};
    const itemsStr = (linesMap[d.id] || []).join(" | ");

    csvRows.push(
      [
        escapeCsv(d.id),
        escapeCsv(d.publicId),
        escapeCsv(d.receiptNo || "N/A"),
        escapeCsv(d.createdAt ? new Date(d.createdAt).toISOString() : ""),
        escapeCsv(d.status),
        escapeCsv(d.donorName),
        escapeCsv(d.donorEmail),
        escapeCsv(d.donorPhone || "N/A"),
        escapeCsv(meta.pan || meta.donorPan || "N/A"),
        escapeCsv(d.amount),
        escapeCsv(d.mode),
        escapeCsv(d.razorpayPaymentId || "N/A"),
        escapeCsv(dedication.occasion || "Direct Impact"),
        escapeCsv(dedication.honoreeName || "N/A"),
        escapeCsv(dedication.message || "N/A"),
        escapeCsv(itemsStr || "General Seva"),
      ].join(","),
    );
  }

  const csvContent = csvRows.join("\r\n");

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="janaseva_donors_ledger_${Date.now()}.csv"`,
    },
  });
}
