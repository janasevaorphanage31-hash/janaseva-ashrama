// scripts/load-and-security-test.mjs
// Professional QA & Security Testing Suite for Janaseva Ashrama Platform

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

async function runBenchmark(name, url, totalRequests = 60, concurrency = 10) {
  process.stdout.write(`Benchmarking [${name}] (${totalRequests} requests, concurrency=${concurrency})... `);
  const latencies = [];
  let successes = 0;
  let failures = 0;

  const queue = Array.from({ length: totalRequests }, (_, i) => i);
  const startTime = Date.now();

  async function worker() {
    while (queue.length > 0) {
      queue.pop();
      const t0 = performance.now();
      try {
        const res = await fetch(url, { headers: { "User-Agent": "Janaseva-LoadTest/1.0" } });
        const t1 = performance.now();
        latencies.push(t1 - t0);
        if (res.status >= 200 && res.status < 400) {
          successes++;
        } else {
          failures++;
        }
      } catch {
        failures++;
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const totalDuration = (Date.now() - startTime) / 1000;
  latencies.sort((a, b) => a - b);

  const avg = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(1);
  const min = latencies[0]?.toFixed(1) || 0;
  const max = latencies[latencies.length - 1]?.toFixed(1) || 0;
  const p50 = latencies[Math.floor(latencies.length * 0.5)]?.toFixed(1) || 0;
  const p95 = latencies[Math.floor(latencies.length * 0.95)]?.toFixed(1) || 0;
  const rps = (totalRequests / totalDuration).toFixed(0);

  console.log(`DONE in ${totalDuration.toFixed(2)}s | ${rps} req/sec`);
  console.log(`   Success: ${successes}/${totalRequests} | Avg: ${avg}ms | p50: ${p50}ms | p95: ${p95}ms | Min/Max: ${min}ms / ${max}ms`);

  return { name, successes, failures, avg, p50, p95, rps };
}

async function runSecurityTests() {
  console.log("\n========================================================");
  console.log("🔒 EXECUTING SECURITY & PENETRATION AUDIT TESTS");
  console.log("========================================================\n");
  let passed = 0;
  let total = 0;

  function assert(title, condition, details = "") {
    total++;
    if (condition) {
      console.log(`  ✔ PASS: ${title}`);
      passed++;
    } else {
      console.error(`  ✖ FAIL: ${title} — ${details}`);
    }
  }

  // 1. Security Headers Verification
  try {
    const res = await fetch(`${BASE_URL}/`);
    const xfo = res.headers.get("x-frame-options");
    const xcto = res.headers.get("x-content-type-options");
    const hsts = res.headers.get("strict-transport-security");
    const ref = res.headers.get("referrer-policy");

    assert("Clickjacking protection (X-Frame-Options)", xfo === "SAMEORIGIN" || xfo === "DENY", `Got: ${xfo}`);
    assert("MIME Sniffing protection (X-Content-Type-Options: nosniff)", xcto === "nosniff", `Got: ${xcto}`);
    assert("Referrer Policy configured", !!ref, `Got: ${ref}`);
    assert("HSTS Header configured", !!hsts, `Got: ${hsts}`);
  } catch (err) {
    assert("Security headers check", false, err.message);
  }

  // 2. Path Traversal & Directory Traversal Attack Simulation
  try {
    const traversalUrls = [
      `${BASE_URL}/uploads/..%2fpackage.json`,
      `${BASE_URL}/uploads/../../package.json`,
      `${BASE_URL}/uploads/%2e%2e%2f%2e%2e%2fpackage.json`,
      `${BASE_URL}/uploads/..\\..\\package.json`,
      `${BASE_URL}/uploads/....//....//package.json`,
    ];

    for (const tUrl of traversalUrls) {
      const res = await fetch(tUrl);
      const text = await res.text();
      const leaked = text.includes('"name": "janaseva-orphanage"');
      assert(`Path Traversal Blocked: ${tUrl.split("/uploads/")[1]}`, !leaked && (res.status === 403 || res.status === 404), `Status: ${res.status}`);
    }
  } catch (err) {
    assert("Path traversal test execution", false, err.message);
  }

  // 3. SQL Injection Resilience on Public Search / Filter APIs
  try {
    const sqlPayloads = [
      `' OR '1'='1`,
      `'; DROP TABLE donations; --`,
      `" UNION SELECT NULL, NULL, NULL --`,
    ];

    for (const payload of sqlPayloads) {
      const res = await fetch(`${BASE_URL}/api/celebrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          celebrantName: payload,
          occasion: "Birthday",
          celebrationDate: "2026-10-15",
          donorName: "Test",
          donorPhone: "+919988776655",
        }),
      });
      assert(`SQL Injection parameterized safely: ${payload.slice(0, 15)}...`, res.status === 200 || res.status === 400, `Status: ${res.status}`);
    }
  } catch (err) {
    assert("SQL injection test execution", false, err.message);
  }

  // 4. Rate Limiting Verification on Sensitive Endpoints
  try {
    let hit429 = false;
    for (let i = 0; i < 15; i++) {
      const res = await fetch(`${BASE_URL}/api/admin/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: `fake-${i}@attacker.com`, password: "wrong" }),
      });
      if (res.status === 429) {
        hit429 = true;
        break;
      }
    }
    assert("Brute-Force Rate Limiting Active on Admin Login (HTTP 429)", hit429, "Rate limiter did not trip");
  } catch (err) {
    assert("Rate limit test execution", false, err.message);
  }

  // 5. Payment Signature Tampering Defense
  try {
    const res = await fetch(`${BASE_URL}/api/donations/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        publicId: "fake-donation-id",
        razorpay_order_id: "order_fake123",
        razorpay_payment_id: "pay_fake456",
        razorpay_signature: "tampered_signature_payload",
      }),
    });
    assert("Tampered payment signature rejected", res.status === 400 || res.status === 404, `Status: ${res.status}`);
  } catch (err) {
    assert("Payment tampering test execution", false, err.message);
  }

  // 6. Unauthenticated Admin Route Access Blocked
  try {
    const adminRoutes = [
      "/api/admin/site-content",
      "/api/admin/analytics",
      "/api/admin/crm/donations",
      "/api/admin/crm/export",
    ];
    for (const r of adminRoutes) {
      const res = await fetch(`${BASE_URL}${r}`);
      assert(`Unauthenticated admin access blocked: ${r}`, res.status === 401, `Status: ${res.status}`);
    }
  } catch (err) {
    assert("Admin protection test execution", false, err.message);
  }

  console.log(`\nSecurity Audit Results: ${passed} / ${total} tests passed.\n`);
  return { passed, total };
}

async function main() {
  console.log("========================================================");
  console.log("🚀 STARTING AUTOMATED LOAD & CONCURRENCY BENCHMARK");
  console.log(`Target: ${BASE_URL}`);
  console.log("========================================================\n");

  const results = [];
  results.push(await runBenchmark("Home Page (SSR / Turbopack)", `${BASE_URL}/`, 60, 10));
  results.push(await runBenchmark("Celebrate Special Day Page", `${BASE_URL}/celebrate-special-day`, 50, 10));
  results.push(await runBenchmark("Impact Cart / Needs Page", `${BASE_URL}/impact`, 50, 10));
  results.push(await runBenchmark("Stories of Hope Page", `${BASE_URL}/stories`, 50, 10));
  results.push(await runBenchmark("Celebrations Public API", `${BASE_URL}/api/celebrations`, 50, 10));

  const securityResults = await runSecurityTests();

  console.log("========================================================");
  console.log("📊 OVERALL SUMMARY REPORT");
  console.log("========================================================");
  const totalReqs = results.reduce((a, b) => a + b.successes + b.failures, 0);
  const totalFails = results.reduce((a, b) => a + b.failures, 0);
  const avgLatency = (results.reduce((a, b) => a + parseFloat(b.avg), 0) / results.length).toFixed(1);

  console.log(`Total Requests Processed: ${totalReqs}`);
  console.log(`Failed Requests: ${totalFails} (Error Rate: ${((totalFails / totalReqs) * 100).toFixed(2)}%)`);
  console.log(`Overall Average Latency: ${avgLatency}ms`);
  console.log(`Security Audit: ${securityResults.passed}/${securityResults.total} Tests Passed`);

  if (totalFails > 0 || securityResults.passed < securityResults.total) {
    console.error("\n❌ TESTS FAILED!");
    process.exit(1);
  } else {
    console.log("\n✅ ALL LOAD AND SECURITY TESTS PASSED WITH 100% SUCCESS!");
    process.exit(0);
  }
}

main().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
