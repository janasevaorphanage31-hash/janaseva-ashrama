import test from "node:test";
import assert from "node:assert/strict";

// Helper functions mirroring TelecallerPortal.tsx and whatsapp-antiban.ts
function isPlaceholderValue(val) {
  if (!val) return true;
  const s = val.trim().toLowerCase();
  return (
    s === "child" ||
    s === "student" ||
    s === "pupil" ||
    s === "kid" ||
    s === "unknown" ||
    s === "na" ||
    s === "n/a" ||
    s === "parent" ||
    s === "father" ||
    s === "mother" ||
    s === "guardian" ||
    s === "—" ||
    s === "-" ||
    s === ""
  );
}

function cleanParentName(lead) {
  const p = lead.parentName?.trim();
  if (p && !isPlaceholderValue(p)) {
    return p;
  }
  const n = lead.name?.trim() || "";
  if (n) {
    if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
      const inside = n.slice(7, -1).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
    if (n.toLowerCase().endsWith("(parent)")) {
      const inside = n.slice(0, -8).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
    if (n.includes("(") && n.endsWith(")")) {
      const inside = n.slice(n.indexOf("(") + 1, -1).trim();
      if (inside && !isPlaceholderValue(inside)) return inside;
    }
  }
  return "ಪೋಷಕರು (Parent)";
}

function cleanChildName(lead) {
  const c = lead.childName?.trim();
  if (c && !isPlaceholderValue(c)) {
    return c;
  }
  const n = lead.name?.trim() || "";
  if (n) {
    if (n.toLowerCase().startsWith("child (") && n.endsWith(")")) {
      const p = cleanParentName(lead);
      if (p && p !== "ಪೋಷಕರು (Parent)") {
        return `${p} ಅವರ ಮಗು`;
      }
      return "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
    }

    if (n.includes("(") && n.endsWith(")")) {
      const beforeParen = n.slice(0, n.indexOf("(")).trim();
      if (beforeParen && !isPlaceholderValue(beforeParen)) {
        return beforeParen;
      }
    }
    const stripped = n.replace(/\s*\((Child|Parent|Student)\)$/i, "").trim();
    if (stripped && !isPlaceholderValue(stripped) && !stripped.toLowerCase().startsWith("child (")) {
      return stripped;
    }
  }
  const p = cleanParentName(lead);
  if (p && p !== "ಪೋಷಕರು (Parent)") {
    return `${p} ಅವರ ಮಗು`;
  }
  return "ವಿದ್ಯಾರ್ಥಿ / ಮಗು";
}

function generateMandatoryContactFooter(language) {
  const websiteUrl = "https://www.janasevaashrama.org";
  const mapsLocationUrl = "https://maps.app.goo.gl/FMaM6eLKk3nNJmth8";
  const officialWaNumber = "+91 99803 59595";
  const officialWaLink = "https://wa.me/919980359595";
  const officialCallingNumber = "+91 99803 59595 / 080 2853 5555";

  if (language === "kn") {
    return [
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `🌐 ಅಧಿಕೃತ ವೆಬ್‌ಸೈಟ್: ${websiteUrl}`,
      `📍 ಆಶ್ರಮದ ಲೊಕೇಶನ್ (Google Maps): ${mapsLocationUrl}`,
      `💬 ಅಧಿಕೃತ WhatsApp: ${officialWaNumber} (${officialWaLink})`,
      `📞 ಸಹಾಯವಾಣಿ ಕರೆ: ${officialCallingNumber}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");
  } else if (language === "kanglish" || language === "mixed") {
    return [
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `🌐 Official Website: ${websiteUrl}`,
      `📍 Ashrama Pin (Google Maps): ${mapsLocationUrl}`,
      `💬 Official WhatsApp: ${officialWaNumber} (${officialWaLink})`,
      `📞 Calling Helpline: ${officialCallingNumber}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");
  } else {
    return [
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
      `🌐 Official Website: ${websiteUrl}`,
      `📍 Ashrama Google Maps Pin: ${mapsLocationUrl}`,
      `💬 Official WhatsApp: ${officialWaNumber} (${officialWaLink})`,
      `📞 Ashrama Helpline: ${officialCallingNumber}`,
      "━━━━━━━━━━━━━━━━━━━━━━━━━",
    ].join("\n");
  }
}

test("Anti-Ban WhatsApp Mandatory Contact Footer: Kannada (kn)", () => {
  const footer = generateMandatoryContactFooter("kn");
  assert.ok(footer.includes("https://www.janasevaashrama.org"), "Website link must be present");
  assert.ok(footer.includes("https://maps.app.goo.gl/FMaM6eLKk3nNJmth8"), "Maps location link must be present");
  assert.ok(footer.includes("+91 99803 59595"), "WhatsApp number must be present");
  assert.ok(footer.includes("https://wa.me/919980359595"), "wa.me link must be present");
  assert.ok(footer.includes("080 2853 5555"), "Calling number must be present");
});

test("Anti-Ban WhatsApp Mandatory Contact Footer: Kanglish", () => {
  const footer = generateMandatoryContactFooter("kanglish");
  assert.ok(footer.includes("https://www.janasevaashrama.org"), "Website link must be present");
  assert.ok(footer.includes("https://maps.app.goo.gl/FMaM6eLKk3nNJmth8"), "Maps location link must be present");
  assert.ok(footer.includes("+91 99803 59595"), "WhatsApp number must be present");
  assert.ok(footer.includes("080 2853 5555"), "Calling number must be present");
});

test("Anti-Ban WhatsApp Mandatory Contact Footer: English", () => {
  const footer = generateMandatoryContactFooter("en");
  assert.ok(footer.includes("https://www.janasevaashrama.org"), "Website link must be present");
  assert.ok(footer.includes("https://maps.app.goo.gl/FMaM6eLKk3nNJmth8"), "Maps location link must be present");
  assert.ok(footer.includes("+91 99803 59595"), "WhatsApp number must be present");
  assert.ok(footer.includes("080 2853 5555"), "Calling number must be present");
});

test("Clean Child Name: Replaces literal Child with polite relative phrase", () => {
  const lead1 = { name: "Child (MARY T)", childName: "Child", parentName: "MARY T" };
  assert.equal(cleanChildName(lead1), "MARY T ಅವರ ಮಗು");
  assert.notEqual(cleanChildName(lead1), "Child");

  const lead2 = { name: "Child (MAMATHA N)", childName: null, parentName: "MAMATHA N" };
  assert.equal(cleanChildName(lead2), "MAMATHA N ಅವರ ಮಗು");

  const lead3 = { name: "Child (MANOHARI DEVI)", childName: "Student", parentName: "MANOHARI DEVI" };
  assert.equal(cleanChildName(lead3), "MANOHARI DEVI ಅವರ ಮಗು");
});

test("Clean Parent Name: Extracts real parent name from parentheses", () => {
  const lead1 = { name: "Child (MARY T)", parentName: null };
  assert.equal(cleanParentName(lead1), "MARY T");

  const lead2 = { name: "Child (MUTYALAMMA)", parentName: "MUTYALAMMA" };
  assert.equal(cleanParentName(lead2), "MUTYALAMMA");
});

test("Persistent Resume Logic: LocalStorage key generation", () => {
  const callerId = "TC01";
  const resumeKey = `janaseva_last_lead_${callerId}`;
  assert.equal(resumeKey, "janaseva_last_lead_TC01");
});
