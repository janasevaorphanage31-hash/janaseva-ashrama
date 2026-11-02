import test from "node:test";
import assert from "node:assert/strict";

// Concise Anti-Ban Logic Verification
function generateConciseAntiBanMessage(options) {
  const {
    leadId,
    parentName,
    donorName,
    childName,
    stream,
    callerId,
    amount = 1500,
    baseUrl = "https://janasevaashrama.org",
  } = options;

  const trackingRef = callerId ? callerId.toUpperCase() : "DIRECT";
  const portalUrl = `${baseUrl}/give?ref=${trackingRef}&lead_id=${leadId}&amount=${amount}`;
  const isParent = stream === "PARENTS" || Boolean(childName);
  const pName = (parentName || donorName || "Noble Supporter").trim();
  const cName = (childName || "nimma muddu magu").trim();

  let lines = [];
  if (isParent) {
    lines = [
      `🙏 Namaskara ${pName} Sir/Madam!`,
      "",
      `Janaseva Ashrama (Turahalli) da 25 makkala kadeyinda nimma muddu magu *${cName}* ge munjaneya Janmadinada Shubhashayagalu! 🎂✨`,
      "",
      `Nimma maguvina janmadinadandu namma 25 anatha baalakarige satvik baale ele oota sponsor maadi aashirvada thagoli. 🍲`,
      "",
      `👉 [ 📲 1-Tap Pay & 80G Tax Receipt ]`,
      portalUrl,
      "",
      `💳 Axis Bank UPI: MAB.037349050110044@axisbank`,
      `🏛️ Janaseva Ashrama (JJ Act KA18CH0242 · 80G Exempt)`,
      "",
      `Shree Devaru nimma kutumbakke aayu-aarogya karunisali! 🙏✨`,
    ];
  } else {
    lines = [
      `🙏 Namaskara ${pName} Sir/Madam!`,
      "",
      `Janaseva Ashrama (Turahalli) da 25 makkala kadeyinda nimage Janmadinada munjaneya advance Shubhashayagalu! 🎂✨`,
      "",
      `Nimma janmadinadandu namma 25 anatha baalakarige satvik baale ele oota sponsor maadi ashervada thagoli. 🍲`,
      "",
      `👉 [ 📲 1-Tap Pay & 80G Tax Receipt ]`,
      portalUrl,
      "",
      `💳 Axis Bank UPI: MAB.037349050110044@axisbank`,
      `🏛️ Janaseva Ashrama (JJ Act KA18CH0242 · 80G Exempt)`,
      "",
      `Makkala nirmala prarthane nimage sada irali. Dhanyavadagalu! 🙏✨`,
    ];
  }

  const text = lines.join("\n");
  return {
    text,
    length: text.length,
    portalUrl,
  };
}

test("Anti-Ban Concise Engine: Parents Stream generates concise message under 600 chars", () => {
  const result = generateConciseAntiBanMessage({
    leadId: "42",
    parentName: "Suresh Gowda",
    childName: "Tanmay",
    stream: "PARENTS",
    callerId: "TC-01",
    amount: 1500,
  });

  // Must be concise & human (< 600 chars) to prevent "Report & Block" spam triggers
  assert.ok(result.length < 600, `Message length ${result.length} exceeds 600 char limit`);
  
  // Must personalize with parent and child name
  assert.ok(result.text.includes("Suresh Gowda"));
  assert.ok(result.text.includes("Tanmay"));
  assert.ok(result.text.includes("Janmadinada Shubhashayagalu"));
  
  // Must include single tracked donation URL with attribution
  assert.ok(result.text.includes("https://janasevaashrama.org/give?ref=TC-01&lead_id=42&amount=1500"));
  
  // Must include official Axis Bank UPI ID
  assert.ok(result.text.includes("MAB.037349050110044@axisbank"));

  // Check URL density: must NOT contain 4 or 5 spam URLs
  const urlMatches = result.text.match(/https?:\/\/[^\s]+/g) || [];
  assert.equal(urlMatches.length, 1, "Concise anti-ban message must contain exactly 1 tracked URL");
});

test("Anti-Ban Concise Engine: Direct Donor Stream generates concise message with donor greeting", () => {
  const result = generateConciseAntiBanMessage({
    leadId: "99",
    donorName: "Anand Murthy",
    stream: "DIRECT_DONOR",
    callerId: "TC-02",
    amount: 2500,
  });

  assert.ok(result.length < 600, `Message length ${result.length} exceeds 600 char limit`);
  assert.ok(result.text.includes("Anand Murthy"));
  assert.ok(result.text.includes("Janmadinada"));
  assert.ok(result.text.includes("https://janasevaashrama.org/give?ref=TC-02&lead_id=99&amount=2500"));
  assert.ok(result.text.includes("MAB.037349050110044@axisbank"));

  const urlMatches = result.text.match(/https?:\/\/[^\s]+/g) || [];
  assert.equal(urlMatches.length, 1, "Must contain exactly 1 tracked URL");
});

test("Anti-Ban Concise Engine: Pure Kannada (ಕನ್ನಡ) script generation for Parents Stream", () => {
  const pName = "ರಾಮೇಶ್ವರ್ ಗೌಡ";
  const cName = "ಆರವ್";
  const portalUrl = "https://janasevaashrama.org/give?ref=TC-15&lead_id=55&amount=1500";

  const lines = [
    `ನಮಸ್ಕಾರ ${pName} ನವರೇ! 🙏`,
    "",
    `ಜನಸೇವಾ ಆಶ್ರಮದ (ತುರಹಳ್ಳಿ) 25 ಮುಗ್ಧ ಮಕ್ಕಳ ಪರವಾಗಿ ಮುದ್ದು ಕಂದ *${cName}* ಅವರಿಗೆ ಮುಂಚಿತ ಹುಟ್ಟುಹಬ್ಬದ ಹಾರ್ದಿಕ ಶುಭಾಶಯಗಳು! 🎂✨`,
    "",
    `ಮಗುವಿನ ಹುಟ್ಟುಹಬ್ಬದ ಸವಿ ನೆನಪಿನಲ್ಲಿ 25 ಬಾಲಕರಿಗೆ ಸಾತ್ವಿಕ ಅನ್ನದಾನ ಸೇವೆ ಮಾಡಿಸಿ ಮಕ್ಕಳ ಮುಗ್ಧ ಆಶೀರ್ವಾದ ಪಡೆಯಿರಿ. 🍲`,
    "",
    `👉 [ 📲 1-ಟ್ಯಾಪ್ ದೇಣಿಗೆ & 80G ರಸೀದಿ ]`,
    portalUrl,
    "",
    `💳 Axis Bank UPI: MAB.037349050110044@axisbank`,
    `🏛️ ಜನಸೇವಾ ಆಶ್ರಮ (JJ Act KA18CH0242 · 80G ಮಾನ್ಯತೆ)`,
    "",
    `ಶ್ರೀ ದೇವರು ಮುದ್ದು ಕಂದ ${cName} ಮತ್ತು ನಿಮ್ಮ ಕುಟುಂಬಕ್ಕೆ ಸಕಲ ಆಯುರಾರೋಗ್ಯ ಕರುಣಿಸಲಿ! 🙏✨`,
  ];

  const text = lines.join("\n");
  assert.ok(text.length < 600, `Kannada message length ${text.length} exceeds 600 chars`);
  assert.ok(text.includes("ರಾಮೇಶ್ವರ್ ಗೌಡ"));
  assert.ok(text.includes("ಆರವ್"));
  assert.ok(text.includes("ಹುಟ್ಟುಹಬ್ಬದ"));
  assert.ok(text.includes("MAB.037349050110044@axisbank"));
  assert.ok(text.includes(portalUrl));
});
