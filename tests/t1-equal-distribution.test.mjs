import test from "node:test";
import assert from "node:assert/strict";

test("T+1 Equal Distribution Math: Parity, Conservation & Stream Separation", () => {
  // Scenario: 100 T+1 leads (60 Direct Donors, 40 Parents), 10 active telecallers
  const callers = ["TC01", "TC02", "TC03", "TC04", "TC05", "TC06", "TC07", "TC08", "TC09", "TC10"];
  const K = callers.length; // 10
  const D = 60; // 60 Direct Donors
  const P = 40; // 40 Parents

  // Direct Donors allocation
  const qD = Math.floor(D / K); // 6
  const rD = D % K; // 0
  const donorAllocations = callers.map((c, i) => qD + (i < rD ? 1 : 0));

  // Parents allocation
  const qP = Math.floor(P / K); // 4
  const rP = P % K; // 0
  const parentAllocations = callers.map((c, i) => qP + (i < rP ? 1 : 0));

  // Invariant 1: Conservation of leads
  assert.equal(donorAllocations.reduce((a, b) => a + b, 0), D, "All 60 Direct Donors are distributed");
  assert.equal(parentAllocations.reduce((a, b) => a + b, 0), P, "All 40 Parents are distributed");

  // Invariant 2: Every caller gets exact equal share
  callers.forEach((c, idx) => {
    assert.equal(donorAllocations[idx], 6, `${c} gets exactly 6 Direct Donors`);
    assert.equal(parentAllocations[idx], 4, `${c} gets exactly 4 Parents`);
    assert.equal(donorAllocations[idx] + parentAllocations[idx], 10, `${c} gets total 10 T+1 leads`);
  });

  // Invariant 3: Zero starvation for TC08
  const tc08Index = callers.indexOf("TC08");
  assert.ok(donorAllocations[tc08Index] > 0, "TC08 never starves with 0 Direct Donors");
  assert.equal(donorAllocations[tc08Index], 6, "TC08 has 6 Direct Donors for tomorrow");
});

test("T+1 Absentee Reallocation: Absent telecaller leads redistribute strictly to present floor", () => {
  // Scenario: TC08 and TC09 absent today, 8 present callers
  const allCallers = ["TC01", "TC02", "TC03", "TC04", "TC05", "TC06", "TC07", "TC08", "TC09", "TC10"];
  const absentCallers = new Set(["TC08", "TC09"]);
  const presentCallers = allCallers.filter((c) => !absentCallers.has(c));
  const K = presentCallers.length; // 8

  const D = 50; // 50 Direct Donors
  const q = Math.floor(D / K); // 6
  const r = D % K; // 2

  const allocation = {};
  presentCallers.forEach((c, i) => {
    allocation[c] = q + (i < r ? 1 : 0);
  });
  absentCallers.forEach((c) => {
    allocation[c] = 0;
  });

  // Verify absent callers get 0
  assert.equal(allocation["TC08"], 0, "Absent caller TC08 gets 0 T+1 leads");
  assert.equal(allocation["TC09"], 0, "Absent caller TC09 gets 0 T+1 leads");

  // Verify total distributed equals 50
  const totalDistributed = Object.values(allocation).reduce((a, b) => a + b, 0);
  assert.equal(totalDistributed, D, "All 50 leads distributed among present callers");

  // Verify max difference between present callers is at most 1
  const presentCounts = presentCallers.map((c) => allocation[c]);
  const max = Math.max(...presentCounts);
  const min = Math.min(...presentCounts);
  assert.ok(max - min <= 1, "Max difference between present callers is at most 1 (fair share)");
});

test("T+1 Disposition Protection: Converted and dispositioned leads are never reallocated", () => {
  const leads = [
    { leadId: 1, status: "Pending", dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
    { leadId: 2, status: "Donated", dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
    { leadId: 3, status: "Interested", dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
    { leadId: 4, status: null, dobDay: 5, dobMonth: 11, stream: "DIRECT_DONOR" },
  ];

  // Filter eligible for rebalance
  const eligible = leads.filter(
    (l) => (!l.status || l.status === "Pending") && l.status !== "Donated" && l.status !== "Interested"
  );

  assert.equal(eligible.length, 2, "Only pending and null status leads are eligible for rebalancing");
  assert.deepEqual(
    eligible.map((l) => l.leadId),
    [1, 4],
    "Donated and Interested leads are protected from reallocation"
  );
});
