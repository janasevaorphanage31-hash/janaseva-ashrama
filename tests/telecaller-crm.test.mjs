import test from "node:test";
import assert from "node:assert/strict";

// 1. Workload Balancing Fair-Share Algorithm Unit Test
function simulateFairShareDistribution(leadIds, activeCallers, mode = "balanced") {
  const perCaller = {};
  const buckets = new Map();
  activeCallers.forEach((c) => {
    perCaller[c] = 0;
    buckets.set(c, []);
  });

  const loadMap = new Map();
  activeCallers.forEach((c) => loadMap.set(c, 0));

  let idx = 0;
  for (const id of leadIds) {
    let target;
    if (mode === "balanced") {
      let minCaller = activeCallers[0];
      let minLoad = loadMap.get(minCaller);
      for (const c of activeCallers) {
        const load = loadMap.get(c);
        if (load < minLoad) {
          minLoad = load;
          minCaller = c;
        }
      }
      target = minCaller;
      loadMap.set(target, minLoad + 1);
    } else {
      target = activeCallers[idx % activeCallers.length];
      idx++;
    }
    buckets.get(target).push(id);
    perCaller[target] = (perCaller[target] || 0) + 1;
  }
  return { perCaller, buckets };
}

test("Workload Balancing: Distributes 1500 leads across 15 callers equally (100 each)", () => {
  const callers = Array.from({ length: 15 }, (_, i) => `TC${String(i + 1).padStart(2, "0")}`);
  const leadIds = Array.from({ length: 1500 }, (_, i) => i + 1);

  const { perCaller } = simulateFairShareDistribution(leadIds, callers, "balanced");

  for (const c of callers) {
    assert.equal(perCaller[c], 100, `Caller ${c} should have exactly 100 leads`);
  }
});

test("Workload Balancing: Distributes uneven lead counts (77 leads across 10 callers)", () => {
  const callers = Array.from({ length: 10 }, (_, i) => `TC${String(i + 1).padStart(2, "0")}`);
  const leadIds = Array.from({ length: 77 }, (_, i) => i + 1);

  const { perCaller } = simulateFairShareDistribution(leadIds, callers, "balanced");

  let total = 0;
  for (const c of callers) {
    total += perCaller[c];
    assert.ok(perCaller[c] === 7 || perCaller[c] === 8, `Caller ${c} count should be 7 or 8`);
  }
  assert.equal(total, 77);
});

// 2. Phone Normalization & 10-Digit Deduplication Test
test("Phone Normalization & Deduplication: Filters duplicates across various prefixes", () => {
  const rawPhones = [
    "9845012345",
    "+91 9845012345",
    "+91-98450-12345",
    "09845012345",
    "9845012345", // duplicate
    "9845099999", // unique
  ];

  const seen = new Set();
  const unique = [];

  for (const p of rawPhones) {
    const digits = p.replace(/\D/g, "");
    if (digits.length >= 10) {
      const p10 = digits.slice(-10);
      if (!seen.has(p10)) {
        seen.add(p10);
        unique.push(p10);
      }
    }
  }

  assert.equal(unique.length, 2);
  assert.deepEqual(unique, ["9845012345", "9845099999"]);
});

// 3. Queue Progression & Zero-Repeat State Machine Test
test("Queue Progression: Never loops back or repeats after 5 leads", () => {
  const mockLeads = [
    { leadId: 101, name: "Lead 1", phone: "9845000001", status: "Pending" },
    { leadId: 102, name: "Lead 2", phone: "9845000002", status: "Pending" },
    { leadId: 103, name: "Lead 3", phone: "9845000003", status: "Pending" },
    { leadId: 104, name: "Lead 4", phone: "9845000004", status: "Pending" },
    { leadId: 105, name: "Lead 5", phone: "9845000005", status: "Pending" },
  ];

  const sessionContacted = new Set();
  const dialedSequence = [];

  // Simulate dialing all 5 leads in focus mode
  for (let step = 0; step < 5; step++) {
    // Current pending queue
    const pendingQueue = mockLeads.filter((l) => !sessionContacted.has(l.leadId));
    assert.ok(pendingQueue.length > 0, "Queue should not be empty during dialing");

    const currentLead = pendingQueue[0];
    dialedSequence.push(currentLead.leadId);

    // Telecaller logs disposition
    sessionContacted.add(currentLead.leadId);
  }

  assert.deepEqual(dialedSequence, [101, 102, 103, 104, 105]);

  // Next check after all 5 are contacted:
  const remainingPending = mockLeads.filter((l) => !sessionContacted.has(l.leadId));
  assert.equal(remainingPending.length, 0, "No pending leads remain");
  // Wrap-around must NOT occur
  assert.equal(remainingPending[0], undefined);
});
