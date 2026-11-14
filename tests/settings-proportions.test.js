const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    await page.setContent(fixtureHTML());
    for (const width of [280, 390, 640, 900, 1200]) for (const largeText of [false, true]) {
      await page.evaluate(({ width, largeText }) => fixture.configure({ settingsView: true, paneWidth: width, largeText }), { width, largeText });
      const rows = await page.evaluate(() => [...document.querySelectorAll("#settings .setting-item")].map(row => {
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
      for (const label of ["Include folders", "Exclude folders"]) {
        const row = rows.find(row => row.name === label);
        assert.equal(row.direction, "column", `${label} stays stacked at ${width}px`);
        assert(row.control.width >= row.info.width - 2, `${label} editor uses the available width`);
      }
    }
    console.log("PASS settings proportions: content-sized rows, balanced desktop columns, full-width folder editors, touch targets and 200% text");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
