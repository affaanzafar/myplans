/**
 * End-to-end smoke test against the static export (`out/`), run with
 * `npm run test:smoke` after `npm run build`.
 *
 * It serves the export, loads it in jsdom, and actually clicks things:
 *  - fresh state shows Hifdh 0/535 and PCM 0/51, with 535 tiles rendered
 *  - clicking a page tile / chapter checkbox updates counters and records today
 *  - clicking again unticks and erases the date
 *  - collapsing a surah hides exactly its tiles
 *  - the Log reflects the same day's entries
 *  - state saved to localStorage reappears after a "reload"
 *  - corrupt localStorage starts fresh, without throwing
 */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import jsdomPkg from "jsdom";
const { JSDOM, VirtualConsole } = jsdomPkg;

// Watchdog: never hang the suite.
const watchdog = setTimeout(() => {
  console.error("Smoke test timed out after 120s");
  process.exit(1);
}, 120000);
watchdog.unref?.();

const step = (msg) => console.log(`— ${msg}`);
const PORT = 4100 + Math.floor(Math.random() * 500);
const BASE = `http://127.0.0.1:${PORT}/`;

const server = spawn(process.execPath, ["scripts/serve.mjs"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: "ignore",
});
server.on("exit", (code, signal) => {
  if (signal === null && code !== null && code !== 0) {
    console.error(`static server exited early with code ${code}`);
  }
});

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;
}

async function waitFor(check, timeoutMs = 8000, intervalMs = 50) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      if (await check()) return true;
    } catch {
      /* keep waiting */
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

const serverUp = await waitFor(async () => {
  try {
    await fetch(BASE);
    return true;
  } catch {
    return false;
  }
}, 15000);
assert.ok(serverUp, "static server must start");

async function openPage({ seed } = {}) {
  const virtualConsole = new VirtualConsole();
  virtualConsole.on("jsdomError", (err) => console.error("jsdom error:", err.detail ?? err));
  const dom = await JSDOM.fromURL(BASE, {
    runScripts: "dangerously",
    resources: "usable",
    pretendToBeVisual: true,
    virtualConsole,
    beforeParse(window) {
      // jsdom's window lacks a few web APIs the React 19 client runtime
      // expects (real browsers have all of these). Bridge them from Node.
      window.MessageChannel = MessageChannel;
      window.ReadableStream = ReadableStream;
      window.TextEncoder = TextEncoder;
      window.TextDecoder = TextDecoder;
      window.AbortController = AbortController;
      window.AbortSignal = AbortSignal;

      // Sniff when React attaches its delegated click listener at the root —
      // a reliable signal that hydration has begun and clicks will register.
      const originalAdd = window.EventTarget.prototype.addEventListener;
      window.__clickListeners = 0;
      window.EventTarget.prototype.addEventListener = function (type, ...rest) {
        if (type === "click") window.__clickListeners += 1;
        return originalAdd.call(this, type, ...rest);
      };

      if (seed !== undefined) {
        window.localStorage.setItem("ledger", seed);
      }
    },
  });
  // Wait for the document to finish loading (poll, so a fast `load` event
  // cannot be missed), then for hydration.
  assert.ok(
    await waitFor(() => dom.window.document.readyState === "complete", 15000),
    "document must finish loading",
  );
  const hydrated = await waitFor(() => dom.window.__clickListeners > 0, 15000, 50);
  if (!hydrated) throw new Error("page never hydrated (no click listener attached)");
  await new Promise((r) => setTimeout(r, 250));
  return dom;
}

const headerText = (doc) => doc.querySelector("header").textContent;

try {
  // --- Fresh state -----------------------------------------------------------
  step("fresh state");
  let dom = await openPage();
  let doc = dom.window.document;

  assert.ok(await waitFor(() => headerText(doc).includes("0 / 535")), "fresh Hifdh is 0 / 535");
  assert.ok(await waitFor(() => headerText(doc).includes("0 / 51")), "fresh PCM is 0 / 51");
  assert.equal(doc.querySelectorAll("main [aria-pressed]").length, 535, "535 tiles rendered");
  assert.equal(doc.querySelectorAll("main [aria-expanded]").length, 64, "64 surah headings");
  assert.equal(doc.querySelectorAll('[role="tab"]').length, 4, "4 tabs");

  // --- Ticking a page ---------------------------------------------------------
  step("tick page 322");
  const tile = doc.querySelector('[aria-label="Page 322"]');
  assert.ok(tile, "page 322 tile exists");
  tile.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true, cancelable: true }));

  assert.ok(await waitFor(() => headerText(doc).includes("1 / 535")), "counter -> 1 / 535");
  assert.equal(doc.querySelector('[aria-label^="Page 322"]').getAttribute("aria-pressed"), "true");
  assert.match(
    doc.querySelector('[aria-label^="Page 322"]').getAttribute("aria-label"),
    /Page 322, memorised \d{1,2} \w{3}/,
  );
  const saved1 = JSON.parse(dom.window.localStorage.getItem("ledger"));
  assert.equal(saved1.version, 1);
  assert.deepEqual(saved1.pages, { "322": todayKey() });
  assert.deepEqual(saved1.chapters, {});

  // Surah counter for Al-Anbiya (page 322 belongs to it): 1/10.
  const anbiyaHeading = [...doc.querySelectorAll("main section")].find(
    (s) => s.getAttribute("aria-label") === "Al-Anbiya",
  );
  assert.match(anbiyaHeading.textContent, /1\/10/);

  // --- Unticking the page -----------------------------------------------------
  step("untick page 322");
  doc.querySelector('[aria-label^="Page 322"]').click();
  assert.ok(await waitFor(() => headerText(doc).includes("0 / 535")), "counter back to 0 / 535");
  const saved2 = JSON.parse(dom.window.localStorage.getItem("ledger"));
  assert.deepEqual(saved2.pages, {});

  // --- Collapsing a surah ------------------------------------------------------
  step("collapse Al-Baqarah");
  const baqarahToggle = [...doc.querySelectorAll("main section [aria-expanded]")].find((b) =>
    b.textContent.includes("Al-Baqarah"),
  );
  assert.equal(baqarahToggle.getAttribute("aria-expanded"), "true");
  baqarahToggle.click();
  assert.ok(
    await waitFor(() => baqarahToggle.getAttribute("aria-expanded") === "false"),
    "surah collapses",
  );
  assert.equal(doc.querySelectorAll("main [aria-pressed]").length, 535 - 48, "48 tiles hidden");
  baqarahToggle.click();
  assert.ok(
    await waitFor(() => doc.querySelectorAll("main [aria-pressed]").length === 535),
    "surah expands back to 535 tiles total",
  );

  // --- PCM tab -----------------------------------------------------------------
  step("PCM tab");
  const pcmTab = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "PCM");
  pcmTab.click();
  assert.ok(
    await waitFor(() => doc.querySelector('input[aria-label="Mole Concept"]')),
    "PCM rows render",
  );

  doc.querySelector('input[aria-label="Mole Concept"]').click();
  assert.ok(await waitFor(() => headerText(doc).includes("1 / 51")), "header -> 1 / 51");
  const chemHeading = [...doc.querySelectorAll("main section")].find(
    (s) => s.getAttribute("aria-label") === "Chemistry",
  );
  assert.match(chemHeading.textContent, /1 \/ 18 chapters/);
  const saved3 = JSON.parse(dom.window.localStorage.getItem("ledger"));
  assert.deepEqual(saved3.chapters, { "Mole Concept": todayKey() });

  doc.querySelector('input[aria-label="Kinematics 1D & Vectors"]').click();
  assert.ok(await waitFor(() => headerText(doc).includes("2 / 51")), "header -> 2 / 51");

  // --- Log tab -------------------------------------------------------------------
  step("Log tab");
  const logTab = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "Log");
  logTab.click();
  assert.ok(
    await waitFor(() => doc.querySelector("main").textContent.includes("Mole Concept (PCM)")),
    "log lists chapters",
  );
  const logText = doc.querySelector("main").textContent;
  assert.ok(!logText.includes("(Hifdh)"), "no Hifdh entries yet");
  assert.ok(logText.includes("Kinematics 1D & Vectors, Mole Concept (PCM)"), "curriculum order");

  // --- Plan tab: divided into single study days ---------------------------------
  step("Plan tab");
  const planTab = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "Plan");
  planTab.click();
  const dayChips = () =>
    [...doc.querySelectorAll("main button[aria-pressed]")].filter((b) =>
      b.getAttribute("aria-label").includes(", day "),
    );
  assert.ok(await waitFor(() => dayChips().length === 95), "95 study-day chips across the plan");
  const planText = () => doc.querySelector("main").textContent.replace(/\s+/g, " ");
  assert.ok(planText().includes("/ 95 days"), "summary counts 95 days");
  assert.ok(
    planText().includes("28 Sep") && planText().includes("31 Dec"),
    "28 Sep – 31 Dec range shown",
  );
  for (const month of ["September", "October", "November", "December"]) {
    assert.ok(planText().includes(month), `month section: ${month}`);
  }
  assert.equal(
    doc.querySelectorAll("[data-ribbon] > div > span").length,
    95,
    "ribbon has 95 day segments",
  );

  // chapters ticked in PCM auto-show their study days
  assert.equal(
    doc.querySelector('[aria-label^="Mole Concept, day 1"]').getAttribute("aria-pressed"),
    "true",
    "PCM tick filled the chapter's days",
  );

  // Gravitation: tick day by day — 1/2 then 2/2 completes the chapter
  doc.querySelector('[aria-label^="Gravitation, day 1"]').click();
  await new Promise((r) => setTimeout(r, 250));
  assert.ok(headerText(doc).includes("2 / 51"), "still 2 / 51 after day 1 of 2");
  doc.querySelector('[aria-label^="Gravitation, day 2"]').click();
  assert.ok(await waitFor(() => headerText(doc).includes("3 / 51")), "3 / 51 after day 2 of 2");
  const filledSegments = [...doc.querySelectorAll("[data-ribbon] > div > span")].filter(
    (seg) => !seg.className.includes("opacity-20"),
  ).length;
  assert.equal(filledSegments, 5, "5 study days filled: 1 + 2 + 2");
  const savedPlan = JSON.parse(dom.window.localStorage.getItem("ledger"));
  assert.ok(savedPlan.planDays["Gravitation#1"] && savedPlan.planDays["Gravitation#2"], "day slots saved");
  assert.ok(savedPlan.chapters["Gravitation"], "chapter recorded complete by its last day");

  // the PCM tab reflects the plan's day ticks
  const pcmTabBack = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "PCM");
  pcmTabBack.click();
  assert.ok(
    await waitFor(() => doc.querySelector('input[aria-label^="Gravitation"]').checked === true),
    "PCM checkbox reflects plan completion",
  );

  // --- Reload: state comes back from localStorage --------------------------------
  step("reload from saved state");
  const persisted = dom.window.localStorage.getItem("ledger");
  dom.window.close();

  dom = await openPage({ seed: persisted });
  doc = dom.window.document;
  assert.ok(await waitFor(() => headerText(doc).includes("0 / 535")), "Hifdh still 0 / 535");
  assert.ok(await waitFor(() => headerText(doc).includes("3 / 51")), "PCM restored to 3 / 51");
  const pcmTab2 = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "PCM");
  pcmTab2.click();
  assert.ok(
    await waitFor(() => doc.querySelector('input[aria-label^="Mole Concept"]')?.checked === true),
    "Mole Concept still checked",
  );

  // study days survive the reload too
  const planTab2 = [...doc.querySelectorAll('[role="tab"]')].find((b) => b.textContent === "Plan");
  planTab2.click();
  assert.ok(
    await waitFor(
      () =>
        [...doc.querySelectorAll("main button[aria-pressed]")].filter(
          (b) =>
            b.getAttribute("aria-label").includes(", day ") &&
            b.getAttribute("aria-pressed") === "true",
        ).length === 5,
    ),
    "5 study-day chips restored after reload",
  );
  dom.window.close();

  // --- Corrupt localStorage starts fresh -------------------------------------------
  step("corrupt storage");
  dom = await openPage({ seed: "{corrupt json,,," });
  doc = dom.window.document;
  assert.ok(await waitFor(() => headerText(doc).includes("0 / 535")), "corrupt -> fresh 0 / 535");
  assert.ok(await waitFor(() => headerText(doc).includes("0 / 51")), "corrupt -> fresh 0 / 51");
  dom.window.close();

  console.log(
    "Smoke test passed — fresh state 0/535 · 0/51; ticking and unticking update counters, dates and the Log; collapsing works; state survives a reload; corrupt storage starts fresh.",
  );
  process.exit(0); // jsdom/undici keep handles alive otherwise
} finally {
  server.kill();
  clearTimeout(watchdog);
}
