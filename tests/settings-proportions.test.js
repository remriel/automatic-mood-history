const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(fixtureHTML());
    await page.evaluate(() => fixture.configure({ settingsView: true }));
    const providers = page.getByRole("combobox", { name: "API provider" });
    for (const [id, name] of [["openai", "OpenAI"], ["anthropic", "Anthropic Claude"], ["gemini", "Google Gemini"], ["deepseek", "DeepSeek"], ["groq", "Groq"]]) {
      await providers.selectOption(id);
      assert.equal(await page.getByLabel(name + " API key", { exact: true }).getAttribute("type"), "password");
      assert.equal(await page.getByRole("switch", { name: "Enable " + name + " analysis" }).getAttribute("aria-checked"), "false");
    }
    for (const width of [280, 390, 640, 900, 1200]) for (const largeText of [false, true]) for (const scope of ["include", "all"]) {
      await page.evaluate(({ width, largeText }) => fixture.configure({ settingsView: true, paneWidth: width, largeText }), { width, largeText });
      const picker = page.getByRole("combobox", { name: "Analysis scope" });
      await picker.selectOption(scope);
      const activeEditor = scope === "all" ? "Exclude folders" : "Include folders";
      const inactiveEditor = scope === "all" ? "Include folders" : "Exclude folders";
      await page.getByRole("textbox", { name: activeEditor }).waitFor();
      assert.equal(await page.getByRole("textbox", { name: inactiveEditor }).count(), 0);
      const coffee = page.getByRole("link", { name: "Buy Me a Coffee" });
      assert.equal(await page.locator("#settings > footer:last-child a").count(), 1);
      assert.equal(await coffee.getAttribute("href"), "https://buymeacoffee.com/remriel");
      assert(await coffee.evaluate(link => getComputedStyle(link).backgroundImage.startsWith('url("data:image/png;base64,')));
      const rows = await page.evaluate(() => [...document.querySelectorAll("#settings .setting-item:not([hidden])")].map(row => {
        const info = row.querySelector(".setting-item-info");
        const control = row.querySelector(".setting-item-control");
        const bounds = element => {
          const r = element.getBoundingClientRect();
          const children = [...element.children].filter(child => child.getBoundingClientRect().height > 0).map(child => child.getBoundingClientRect());
          const contentHeight = children.length ? Math.max(...children.map(child => child.bottom)) - Math.min(...children.map(child => child.top)) : 0;
          return { width: r.width, height: r.height, contentHeight };
        };
        return {
          name: row.querySelector(".setting-item-name").textContent,
          direction: getComputedStyle(row).flexDirection,
          info: bounds(info), control: bounds(control),
          targets: [...control.querySelectorAll("button, input, textarea, select")].map(element => ({ tag: element.tagName, height: element.getBoundingClientRect().height }))
        };
      }));
      for (const row of rows) {
        const label = `${width}px${largeText ? " at 200%" : ""}: ${row.name}`;
        if (row.direction === "column") {
          assert(row.info.height - row.info.contentHeight <= 4, `${label}: information has excess empty height`);
          assert(row.control.height - row.control.contentHeight <= 4, `${label}: controls have excess empty height`);
        } else if (width >= 900) {
          assert(row.control.width <= 322, `${label}: controls dominate the row`);
          assert(row.info.width >= row.control.width, `${label}: text has less space than controls`);
        }
        for (const target of row.targets) assert(target.height >= 43, `${label}: ${target.tag} has a small touch target`);
      }
      {
        const label = activeEditor;
        const row = rows.find(row => row.name === label);
        assert.equal(row.direction, "column", `${label} stays stacked at ${width}px`);
        assert(row.control.width >= row.info.width - 2, `${label} editor uses the available width`);
      }
    }
    console.log("PASS settings proportions: content-sized rows, balanced desktop columns, full-width folder editors, touch targets and 200% text");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
