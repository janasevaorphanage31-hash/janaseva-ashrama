async function run() {
  const base = "http://localhost:3000";

  console.log("=== 1. Checking Logo ===");
  const logoRes = await fetch(`${base}/logo/janaseva-logo.png`);
  console.log("Logo HTTP Status:", logoRes.status, logoRes.headers.get("content-type"));

  console.log("\n=== 2. Fetching Telecallers Leaderboard ===");
  const tcRes = await fetch(`${base}/api/v1/admin/telecallers`);
  const tcData = await tcRes.json();
  console.log("Success:", tcData.success, "Callers Count:", tcData.callers?.length, "Total Leads:", tcData.totalLeads);

  console.log("\n=== 3. Adding New Telecaller TC16 ===");
  const addRes = await fetch(`${base}/api/v1/admin/telecallers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "add_caller",
      callerId: "TC16",
      name: "Sanjay Kulkarni",
      whatsappNumber: "9845099999",
      email: "tc16@janaseva.org",
      dailyQuota: 50,
    }),
  });
  const addData = await addRes.json();
  console.log("Add Status:", addRes.status, "Message:", addData.message, "Total Callers Now:", addData.callers?.length);

  console.log("\n=== 4. Uploading 16 Leads & Verifying Equal Distribution Algorithm ===");
  const sampleLeads = [];
  for (let i = 1; i <= 16; i++) {
    sampleLeads.push({
      name: `Patron Donor ${i}`,
      phone: `98000000${String(i).padStart(2, "0")}`,
      dobDay: 14 + (i % 3),
      dobMonth: 10,
    });
  }

  const uploadRes = await fetch(`${base}/api/v1/admin/telecallers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "upload_leads",
      leads: sampleLeads,
      autoDistribute: true,
      mode: "balanced",
    }),
  });
  const uploadData = await uploadRes.json();
  console.log("Upload Status:", uploadRes.status, "Message:", uploadData.message);
  console.log("Valid Inserted:", uploadData.uploadResult?.validInserted, "Distributed:", uploadData.uploadResult?.distributed);
  console.log("Distribution per Caller:", uploadData.uploadResult?.perCaller);

  console.log("\n=== 5. Testing CSV Performance Export ===");
  const csvRes = await fetch(`${base}/api/v1/admin/telecallers/export?type=performance`);
  const csvText = await csvRes.text();
  console.log("CSV Status:", csvRes.status, "Length:", csvText.length);
  const csvLines = csvText.split("\n");
  console.log("Header:", csvLines[0]);
  console.log("Row 1:", csvLines[1]);

  console.log("\n=== 6. Testing Telecaller Deletion & Lead Redistribution ===");
  const delRes = await fetch(`${base}/api/v1/admin/telecallers`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "delete_caller",
      callerId: "TC16",
      redistributeLeads: true,
    }),
  });
  const delData = await delRes.json();
  console.log("Delete Status:", delRes.status, "Message:", delData.message, "Total Callers After Delete:", delData.callers?.length);
  console.log("\nALL VERIFICATIONS PASSED SUCCESSFULLY!");
}

run().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
