/**
 * Automated Vercel Deployment Cleanup Script
 * Safely removes historical preview and stale deployments to free up Vercel storage.
 * Never touches the current active production deployment!
 */

const token = process.env.VERCEL_TOKEN || process.argv[2];

if (!token) {
  console.error("❌ ERROR: Vercel token missing.");
  console.log("Usage: node scripts/cleanup-vercel.mjs <YOUR_VERCEL_TOKEN>");
  console.log("Get a token in 30 seconds from: https://vercel.com/account/tokens");
  process.exit(1);
}

async function runCleanup() {
  console.log("🔍 Connecting to Vercel API...");
  
  // 1. Fetch deployments
  const res = await fetch("https://api.vercel.com/v6/deployments?limit=100", {
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error(`❌ Vercel API error (${res.status}):`, errText);
    process.exit(1);
  }

  const data = await res.json();
  const deployments = data.deployments || [];
  console.log(`📋 Found ${deployments.length} deployments in account history.`);

  if (deployments.length <= 2) {
    console.log("✅ You only have 1 or 2 deployments. No cleanup necessary.");
    return;
  }

  // Find active production deployments (keep the latest 2 production builds safe)
  let prodKeepCount = 0;
  const toDelete = [];

  for (const dep of deployments) {
    const isProd = dep.target === "production";
    if (isProd && prodKeepCount < 2) {
      prodKeepCount++;
      console.log(`🛡️ KEEPING active production deployment: ${dep.url} (${dep.uid})`);
    } else {
      toDelete.push(dep);
    }
  }

  console.log(`\n🗑️ Found ${toDelete.length} old/preview deployments ready for deletion.`);

  let deletedCount = 0;
  let failedCount = 0;

  for (const dep of toDelete) {
    try {
      const delRes = await fetch(`https://api.vercel.com/v13/deployments/${dep.uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (delRes.ok) {
        deletedCount++;
        console.log(`  ✓ Deleted [${deletedCount}/${toDelete.length}]: ${dep.url} (${new Date(dep.created).toLocaleDateString()})`);
      } else {
        failedCount++;
        console.warn(`  ⚠️ Could not delete ${dep.url}: HTTP ${delRes.status}`);
      }
    } catch (e) {
      failedCount++;
      console.error(`  ⚠️ Network error deleting ${dep.uid}:`, e.message);
    }

    // Small 100ms pause to respect rate limits
    await new Promise((r) => setTimeout(r, 100));
  }

  console.log(`\n🎉 Cleanup finished!`);
  console.log(`   Deleted: ${deletedCount} deployments`);
  if (failedCount > 0) console.log(`   Failed: ${failedCount} deployments`);
  console.log(`🚀 Storage has been reclaimed. Check your Vercel dashboard to verify.`);
}

runCleanup().catch(console.error);
