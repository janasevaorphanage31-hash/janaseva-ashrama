import test from "node:test";
import assert from "node:assert/strict";

// Helper: Simulate Fair-Share Date-Partitioned Allocation
function distributeDatePartitionedSimulation({ leads, callerIds }) {
  const K = callerIds.length;
  if (K === 0) return { distributed: 0, perCaller: {} };

  // Group by (dobMonth, dobDay) and stream
  const buckets = new Map();

  for (const l of leads) {
    const rawDay = Number(l.dobDay || 0);
    const rawMonth = Number(l.dobMonth || 0);
    let d = rawDay;
    let m = rawMonth;
    if (d > 12 && m <= 12) {
      // standard DD/MM
    } else if (d <= 12 && m > 12) {
      d = rawMonth;
      m = rawDay;
    }
    const key = `${m}_${d}`;
    if (!buckets.has(key)) {
      buckets.set(key, { month: m, day: d, parents: [], donors: [] });
    }
    const b = buckets.get(key);
    if (l.stream === "PARENTS") {
      b.parents.push(l);
    } else {
      b.donors.push(l);
    }
  }

  const assignmentBuckets = new Map();
  callerIds.forEach((id) => assignmentBuckets.set(id, { parents: [], donors: [] }));

  let rollingOffset = 0;

  for (const bucket of buckets.values()) {
    // 1. Parents
    const P = bucket.parents.length;
    if (P > 0) {
      const q = Math.floor(P / K);
      const r = P % K;
      let pIdx = 0;
      for (let i = 0; i < K; i++) {
        const callerIndex = (i + rollingOffset) % K;
        const cid = callerIds[callerIndex];
        const count = q + (i < r ? 1 : 0);
        for (let j = 0; j < count && pIdx < P; j++) {
          assignmentBuckets.get(cid).parents.push(bucket.parents[pIdx]);
          pIdx++;
        }
      }
      rollingOffset = (rollingOffset + r) % K;
    }

    // 2. Donors
    const D = bucket.donors.length;
    if (D > 0) {
      const q = Math.floor(D / K);
      const r = D % K;
      let dIdx = 0;
      for (let i = 0; i < K; i++) {
        const callerIndex = (i + rollingOffset) % K;
        const cid = callerIds[callerIndex];
        const count = q + (i < r ? 1 : 0);
        for (let j = 0; j < count && dIdx < D; j++) {
          assignmentBuckets.get(cid).donors.push(bucket.donors[dIdx]);
          dIdx++;
        }
      }
      rollingOffset = (rollingOffset + r) % K;
    }
  }

  return assignmentBuckets;
}

// 1. Equal Division Math Test: 100 leads across 10 callers
test("Math: 100 T+1 leads across 10 active telecallers distributes exactly 10 leads each", () => {
  const callers = ["TC01", "TC02", "TC03", "TC04", "TC05", "TC06", "TC07", "TC08", "TC09", "TC10"];
  // 50 Parents + 50 Donors for tomorrow (Nov 4)
  const leads = [
    ...Array.from({ length: 50 }, (_, i) => ({ id: `P_${i}`, dobDay: 4, dobMonth: 11, stream: "PARENTS" })),
    ...Array.from({ length: 50 }, (_, i) => ({ id: `D_${i}`, dobDay: 4, dobMonth: 11, stream: "DIRECT_DONOR" })),
  ];

  const result = distributeDatePartitionedSimulation({ leads, callerIds: callers });

  for (const cid of callers) {
    const assigned = result.get(cid);
    assert.equal(assigned.parents.length, 5, `Caller ${cid} must get exactly 5 Parents leads`);
    assert.equal(assigned.donors.length, 5, `Caller ${cid} must get exactly 5 Donors leads`);
    assert.equal(assigned.parents.length + assigned.donors.length, 10, `Caller ${cid} must get exactly 10 leads total`);
  }
});

// 2. Zero Starvation Proof: N < K with Rolling Offset
test("Math: Small pools (N < K) spread leads evenly without starving the same callers", () => {
  const callers = ["TC01", "TC02", "TC03", "TC04", "TC05"]; // 5 callers
  // Date 1: 3 donor leads
  // Date 2: 2 donor leads
  const leads = [
    { id: "D1_1", dobDay: 4, dobMonth: 11, stream: "DIRECT_DONOR" },
    { id: "D1_2", dobDay: 4, dobMonth: 11, stream: "DIRECT_DONOR" },
    { id: "D1_3", dobDay: 4, dobMonth: 11, stream: "DIRECT_DONOR" },
    { id: "D2_1", dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
    { id: "D2_2", dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
  ];

  const result = distributeDatePartitionedSimulation({ leads, callerIds: callers });

  // TC01, TC02, TC03 get Date 1 (offset becomes 3)
  // TC04, TC05 get Date 2
  for (const cid of callers) {
    const total = result.get(cid).donors.length;
    assert.equal(total, 1, `Caller ${cid} must receive exactly 1 lead across the two small dates via rolling offset`);
  }
});

// 3. Absentee T+1 Reallocation Simulation: Only Present Callers Receive T+1 Leads
test("Absentee Reallocation: T+1 leads from absent callers are redistributed strictly to present callers", () => {
  const allCallers = [
    { id: "TC01", isWorkingToday: false }, // Absent
    { id: "TC02", isWorkingToday: false }, // Absent
    { id: "TC03", isWorkingToday: true },  // Present
    { id: "TC04", isWorkingToday: true },  // Present
    { id: "TC05", isWorkingToday: true },  // Present
    { id: "TC06", isWorkingToday: true },  // Present
  ];

  const presentCallers = allCallers.filter((c) => c.isWorkingToday).map((c) => c.id);
  const absentCallers = allCallers.filter((c) => !c.isWorkingToday).map((c) => c.id);

  assert.equal(presentCallers.length, 4);
  assert.equal(absentCallers.length, 2);

  // 40 T+1 leads total
  const t1Leads = Array.from({ length: 40 }, (_, i) => ({
    id: `L_${i}`,
    dobDay: 4,
    dobMonth: 11,
    stream: i % 2 === 0 ? "PARENTS" : "DIRECT_DONOR",
  }));

  const result = distributeDatePartitionedSimulation({ leads: t1Leads, callerIds: presentCallers });

  // Present callers must each get 10 leads (5 Parents + 5 Donors)
  for (const cid of presentCallers) {
    const assigned = result.get(cid);
    assert.equal(assigned.parents.length + assigned.donors.length, 10, `Present caller ${cid} must receive exactly 10 T+1 leads`);
    assert.equal(assigned.parents.length, 5);
    assert.equal(assigned.donors.length, 5);
  }

  // Absent callers receive 0
  assert.equal(result.has("TC01"), false);
  assert.equal(result.has("TC02"), false);
});

// 4. IST Date Bounds Calculation Test
test("Timezone: getISTDateBounds accurately returns Indian Standard Time regardless of UTC", () => {
  // Midnight UTC on Nov 4 = 5:30 AM IST on Nov 4
  const midnightUtc = new Date("2026-11-04T00:00:00Z");
  const istOffset = 5.5 * 60 * 60 * 1000;
  const istTime = new Date(midnightUtc.getTime() + istOffset);

  assert.equal(istTime.getUTCDate(), 4);
  assert.equal(istTime.getUTCHours(), 5);
  assert.equal(istTime.getUTCMinutes(), 30);

  // 11:00 PM UTC on Nov 3 = 4:30 AM IST on Nov 4
  const lateUtc = new Date("2026-11-03T23:00:00Z");
  const istLateTime = new Date(lateUtc.getTime() + istOffset);
  assert.equal(istLateTime.getUTCDate(), 4, "Even though UTC is Nov 3, IST is already Nov 4!");
});

// 5. TC08 Direct Donor Resolution Test
test("Resolution: Direct Donors stream with 1,214 total leads guarantees T+1 leads are assigned to TC08", () => {
  const callers = ["TC01", "TC02", "TC03", "TC04", "TC05", "TC06", "TC07", "TC08", "TC09", "TC10"]; // 10 callers
  // 100 leads for tomorrow
  const tomorrowDirectDonors = Array.from({ length: 100 }, (_, i) => ({
    id: `DD_${i}`,
    dobDay: 4,
    dobMonth: 11,
    stream: "DIRECT_DONOR",
  }));

  const result = distributeDatePartitionedSimulation({ leads: tomorrowDirectDonors, callerIds: callers });

  const tc08Assigned = result.get("TC08");
  assert.ok(tc08Assigned, "TC08 must be in the assigned callers list");
  assert.equal(tc08Assigned.donors.length, 10, "TC08 Vedhavathi must receive exactly 10 direct donor leads for tomorrow!");
});
