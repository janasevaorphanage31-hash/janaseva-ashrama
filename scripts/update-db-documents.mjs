import "dotenv/config";
import pg from "pg";

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

await client.query("DELETE FROM documents");

const docs = [
  {
    title: "Form 10AC - Section 80G Provisional Approval (URN: AABTJ7431MF20231)",
    category: "Tax documents",
    version: "AY 2024-25 to 2026-27",
    published_on: "2023-09-04",
    file_url: "/documents/form-10ac-80g-approval.pdf",
    note: "Order for provisional approval under Section 80G granted to JANA SEVA SAMRUDDI EDUCATION & RURAL DEVELOPMENT SOCIETY R (PAN: AABTJ7431M, DIN: AABTJ7431MF2023101) by Principal Commissioner of Income Tax.",
    status: "published",
    sort_order: 1,
  },
  {
    title: "Govt of Karnataka Child Care Institution Registration (Form 28, JJ Act 2015)",
    category: "Registration",
    version: "Reg No: KA18CH0242 (2025-2030)",
    published_on: "2025-03-27",
    file_url: "/documents/jj-act-child-care-institution-registration-form-28.pdf",
    note: "Official Certificate of Registration from Directorate of Child Protection, Government of Karnataka under Section 41 of JJ Act 2015. Registered Children Home for Boys with approved capacity of 25 children.",
    status: "published",
    sort_order: 2,
  },
  {
    title: "Ministry of Corporate Affairs CSR Registration Certificate (Form CSR-1)",
    category: "Corporate & CSR",
    version: "CSR00078800 (17-09-2024)",
    published_on: "2024-09-17",
    file_url: "/documents/mca-csr-1-registration-certificate.pdf",
    note: "Official approval from ROC-Delhi / Ministry of Corporate Affairs (SRN-F98737448) certifying entity for undertaking CSR activities under Section 135 of Companies Act, 2013.",
    status: "published",
    sort_order: 3,
  },
  {
    title: "Section 12AA Registration Order — 100% Tax-Exempt Charitable Entity",
    category: "Tax documents",
    version: "AY 2018-19 onwards",
    published_on: "2018-09-18",
    file_url: "/documents/section-12aa-registration-certificate.pdf",
    note: "Official Order from CIT (Exemptions) Bangalore granting Section 12AA registration (Order No: ITBA/EXM/S/12AA/2018-19/1012296034(1), Reg No: CIT(EXEMPTION S) BANGALORE/12AA/2018-19/A/10403).",
    status: "published",
    sort_order: 4,
  },
  {
    title: "Income Tax Department Permanent Account Number (PAN Card)",
    category: "Registration",
    version: "PAN: AABTJ7431M (Est. 02/04/2013)",
    published_on: "2013-04-02",
    file_url: "/documents/society-pan-card.pdf",
    note: "Permanent Account Number card of Janaseva Samruddi Education & Rural Development Society R issued by Income Tax Department, Govt of India.",
    status: "published",
    sort_order: 5,
  },
  {
    title: "Child Safeguarding & Protection Policy",
    category: "Policies",
    version: "v2025.1",
    published_on: "2025-01-10",
    file_url: null,
    note: "Strict protocols for child privacy, visitor screening, photography consent, and psychological well-being.",
    status: "published",
    sort_order: 6,
  },
  {
    title: "Donation, 80G Tax Receipt & Refund Policy",
    category: "Policies",
    version: "v2024.3",
    published_on: "2024-06-01",
    file_url: null,
    note: "Clear operational principles governing donation allocation, 80G certificates, transparency, and refund requests.",
    status: "published",
    sort_order: 7,
  },
  {
    title: "Proposed Future Permanent Campus Blueprint & Vision Plan",
    category: "Project reports",
    version: "Phase-1",
    published_on: "2024-11-15",
    file_url: null,
    note: "Architectural blueprint and sustainability roadmap for the upcoming permanent campus in Bangalore.",
    status: "published",
    sort_order: 8,
  },
];

for (const d of docs) {
  await client.query(
    `INSERT INTO documents (title, category, version, published_on, file_url, note, status, sort_order)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
    [d.title, d.category, d.version, d.published_on, d.file_url, d.note, d.status, d.sort_order]
  );
}

const res = await client.query("SELECT id, title, category, status, file_url FROM documents ORDER BY sort_order");
console.log("Successfully updated documents in DB:\n", res.rows);

await client.end();
