// background.js (MV3, module)
const CAL_SETTINGS_URL = "https://calendar.google.com/calendar/u/0/r/settings";

chrome.action.onClicked.addListener(async (tab) => {
  try {
    // Open Settings in a background tab for a reliable toggle.
    const created = await chrome.tabs.create({ url: CAL_SETTINGS_URL, active: false });
    const tabId = created.id;

    // Inject the toggler and get the result.
    const [{ result }] = await chrome.scripting.executeScript({
      target: { tabId },
      func: toggleDeclinedEvents,
      args: []
    });

    // Badge reflects new state.
    await setBadge(result?.enabled);

    // Close the temporary settings tab.
    await chrome.tabs.remove(tabId);
  } catch (e) {
    console.error("Toggle failed:", e);
    await setBadge(null); // clear on error
  }
});

async function setBadge(enabled) {
  if (enabled === true) {
    await chrome.action.setBadgeText({ text: "ON" });
  } else if (enabled === false) {
    await chrome.action.setBadgeText({ text: "OFF" });
  } else {
    await chrome.action.setBadgeText({ text: "" });
  }
}

/**
 * Runs in the Settings tab. Locates and toggles the "Show declined events" checkbox.
 * Returns {enabled: boolean} indicating the new state.
 *
 * NOTE: Relies on English UI text. For other languages, add localized strings to TEXT_MATCHES.
 */
function toggleDeclinedEvents() {
  const TEXT_MATCHES = [
    "Show declined events"
    // e.g. "Afficher les événements refusés", "Zeige abgelehnte Termine", etc.
  ];

  function waitFor(cond, timeoutMs = 8000, intervalMs = 100) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const timer = setInterval(() => {
        if (cond()) { clearInterval(timer); resolve(true); }
        if (Date.now() - start > timeoutMs) { clearInterval(timer); reject(new Error("Timed out waiting for condition")); }
      }, intervalMs);
    });
  }

  function findCheckbox() {
    // A) Label exact match -> input via htmlFor or child input
    const labels = Array.from(document.querySelectorAll("label"));
    for (const label of labels) {
      const t = label.textContent?.trim();
      if (t && TEXT_MATCHES.includes(t)) {
        if (label.htmlFor) {
          const input = document.getElementById(label.htmlFor);
          if (input && input.type === "checkbox") return input;
        }
        const input = label.querySelector('input[type="checkbox"]');
        if (input) return input;
      }
    }

    // B) Any element containing the text; search nearby for a checkbox
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_ELEMENT, null);
    let node;
    while ((node = walker.nextNode())) {
      const txt = node.textContent?.trim();
      if (!txt) continue;
      if (TEXT_MATCHES.some(m => txt === m || txt.includes(m))) {
        let scope = node;
        for (let i = 0; i < 5 && scope; i++) {
          const cb = scope.querySelector('input[type="checkbox"]');
          if (cb) return cb;
          scope = scope.parentElement;
        }
      }
    }

    // C) Heuristic by aria-label (English)
    for (const cb of document.querySelectorAll('input[type="checkbox"]')) {
      const a = (cb.getAttribute("aria-label") || "").toLowerCase();
      if (a.includes("declined")) return cb;
    }

    return null;
  }

  return (async () => {
    // Wait for Settings UI to render
    await waitFor(() => document.body && document.body.innerText.length > 100);

    const cb = findCheckbox();
    if (!cb) throw new Error("Could not locate 'Show declined events' checkbox.");

    // Toggle via click (lets Calendar handle persistence)
    cb.click();

    // Allow state to settle
    await new Promise(r => setTimeout(r, 250));

    return { enabled: cb.checked };
  })();
}
