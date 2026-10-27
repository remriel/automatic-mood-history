const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium, webkit, devices } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");

async function inspect(page, label) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const overflow = await page.evaluate(() => {
    const pane = document.getElementById("pane").getBoundingClientRect();
    return [...document.querySelectorAll("html,body,#pane,#pane *")].flatMap(el => {
      if (!(el instanceof HTMLElement)) return [];
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return [];
      return el.scrollWidth > el.clientWidth + 1 || r.left < pane.left - 1 || r.right > pane.right + 1 ? [el.className || el.tagName] : [];
    });
  });
  assert.deepEqual(overflow, [], `${label}: no horizontal overflow`);
  const smallTargets = await page.locator(".auto-mood-actions button,.auto-mood-series-toggle,.auto-mood-day-date a,.auto-mood-settings button,.auto-mood-settings input").evaluateAll(elements =>
    elements.filter(el => el.getBoundingClientRect().width && el.getBoundingClientRect().height < 44).map(el => el.textContent || el.getAttribute("aria-label")));
  assert.deepEqual(smallTargets, [], `${label}: controls and entry links have 44px touch targets`);
}

async function run() {
  for (const [name, engine, device] of [["android", chromium, "Pixel 7"], ["iphone", webkit, "iPhone 13"]]) {
    const browser = await engine.launch({ headless: true });
    try {
      const context = await browser.newContext({ ...devices[device] });
      const page = await context.newPage(), errors = [];
      page.on("pageerror", error => errors.push(error.message));
      await page.route("**/*", route => route.abort());
      await page.setContent(fixtureHTML());
      assert.equal(await page.evaluate(() => typeof process + "/" + typeof Buffer), "undefined/undefined");
      for (const theme of ["light", "dark"]) {
        for (const width of [320, 360, 390, 430, 844]) {
          await page.setViewportSize({ width, height: width > 430 ? 390 : 844 });
          for (const mode of ["empty", "one", "insufficient", "dense"]) {
            await page.evaluate(options => fixture.configure(options), { theme, mode, count: mode === "one" ? 1 : mode === "dense" ? 365 : 12, longText: true });
            await inspect(page, `${name} ${theme} ${width}px ${mode}`);
          }
        }
      }
      await page.setViewportSize({ width: 390, height: 844 });
      await page.evaluate(() => fixture.configure({ count: 32 }));
      for (const label of ["Mood", "Energy", "Connection", "Intensity"]) {
        const button = page.getByRole("button", { name: label, exact: true });
        await button.tap();
        await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
        assert.equal(await button.getAttribute("aria-pressed"), "false");
        await button.tap();
        await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
        assert.equal(await button.getAttribute("aria-pressed"), "true");
      }
      for (const [label, key] of [["Analyze changed", "analyze"], ["Retry all with Groq", "retry"], ["Check Groq", "check"], ["Retry fallback entries", "recover"]]) {
        await page.getByRole("button", { name: label, exact: true }).tap();
        await page.waitForFunction(() => !fixture.plugin.activeScan && !fixture.plugin.checkingGroq);
        assert.equal(await page.evaluate(key => fixture.calls[key], key), 1);
      }
      await page.locator(".auto-mood-day-date a").first().tap();
      assert((await page.evaluate(() => window.lastOpenedEntry)).endsWith("(Automatic Mood History)"));
      if (process.env.MOBILE_QA_DIR) {
        fs.mkdirSync(process.env.MOBILE_QA_DIR, { recursive: true });
        await page.screenshot({ path: path.join(process.env.MOBILE_QA_DIR, `${name}-dashboard.png`) });
      }
      await page.evaluate(() => fixture.configure({ settingsView: true }));
      await inspect(page, `${name}: settings`);
      const keyInput = page.getByLabel("Groq API key", { exact: true });
      assert.equal(await keyInput.getAttribute("type"), "password");
      await keyInput.fill("fictional-mobile-ui-key");
      await page.getByRole("button", { name: "Save key", exact: true }).tap();
      assert.equal(await keyInput.inputValue(), "", "saved key is cleared from the input");
      assert.equal(await page.evaluate(() => fixture.plugin.apiKey()), "fictional-mobile-ui-key");
      assert(!(await page.locator("#settings").textContent()).includes("fictional-mobile-ui-key"));
      await page.getByRole("button", { name: "Clear saved key", exact: true }).tap();
      assert.equal(await page.evaluate(() => fixture.plugin.apiKey()), "");
      assert.equal(await page.evaluate(() => fixture.calls.analyze), 1, "key setup never initiates analysis");
      await page.getByRole("switch", { name: "Enable Groq analysis", exact: true }).tap();
      assert.equal(await page.evaluate(() => fixture.plugin.settings.enableGroq), false);
      await page.getByRole("textbox", { name: "Include folders", exact: true }).fill("Journal\nDaily Notes");
      await page.evaluate(() => fixture.configure({ settingsView: true, largeText: true, longText: true }));
      await inspect(page, `${name}: settings at 200% text`);
      if (process.env.MOBILE_QA_DIR) await page.screenshot({ path: path.join(process.env.MOBILE_QA_DIR, `${name}-settings.png`) });
      assert.deepEqual(errors, [], `${name}: no runtime errors`);
      console.log(`${name}: portrait/landscape 320–844px, light/dark, 365 days, touch actions, secret field and 200% text passed`);
    } finally { await browser.close(); }
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
