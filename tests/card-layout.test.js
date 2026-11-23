const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");
const { assertReadableCards } = require("./card-readability");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1200 } });
    await page.setContent(fixtureHTML());
    for (const theme of ["light", "dark"]) {
      for (const [paneWidth, largeText, columns] of [
        [1440, false, 5], [1200, false, 5], [1024, false, 5],
        [800, false, 3], [450, false, 2], [320, false, 1],
        [1440, true, 3], [1000, true, 2], [600, true, 1]
      ]) {
        await page.evaluate(options => fixture.configure(options), { theme, paneWidth, largeText, count: 32 });
        const label = `${theme} ${paneWidth}px ${largeText ? "200%" : "100%"}`;
        await assertReadableCards(page, label);
        const cards = await page.locator(".auto-mood-card").evaluateAll(elements => elements.map(element => {
          const rect = element.getBoundingClientRect();
          return { top: rect.top, left: rect.left, right: rect.right, width: rect.width };
        }));
        assert.equal(cards.filter(card => Math.abs(card.top - cards[0].top) < 1).length, columns, `${label}: expected cards in the first row`);
        const firstRow = cards.slice(0, columns);
        assert(firstRow.every(card => Math.abs(card.width - firstRow[0].width) < 1), `${label}: first row has equal card widths`);
        if (columns === 5) {
          const grid = await page.locator(".auto-mood-cards").boundingBox();
          assert(Math.abs(firstRow[0].left - grid.x) < 1 && Math.abs(firstRow[4].right - (grid.x + grid.width)) < 1, `${label}: desktop cards fill the row`);
        }
      }
    }
    console.log("PASS readable summary and recorded-day cards across desktop, narrow panes, and enlarged text");
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
