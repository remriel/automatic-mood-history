const assert = require("node:assert/strict");
const { chromium } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
    await page.setContent(fixtureHTML());
    for (const width of [280, 320, 640, 1000]) for (const largeText of [false, true]) {
      await page.evaluate(options => fixture.configure(options), { paneWidth: width, largeText, count: 20 });
      const layout = await page.evaluate(() => {
        const centeredRows = (containerSelector, childSelector) => {
          const container = document.querySelector(containerSelector).getBoundingClientRect();
          const rows = [];
          for (const el of document.querySelectorAll(childSelector)) {
            const box = el.getBoundingClientRect();
            let row = rows.find(value => Math.abs(value.top - box.top) < 1);
            if (!row) rows.push(row = { top: box.top, left: box.left, right: box.right });
            else { row.left = Math.min(row.left, box.left); row.right = Math.max(row.right, box.right); }
          }
          return rows.map(row => Math.abs((row.left + row.right) / 2 - (container.left + container.right) / 2));
        };
        const buttonStyle = selector => {
          const style = getComputedStyle(document.querySelector(selector));
          return [style.minHeight, style.fontSize, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
        };
        const connection = [...document.querySelectorAll('.auto-mood-card-label')].find(el => el.textContent === 'AVG CONNECTION');
        const word = document.createRange(); word.setStart(connection.firstChild, 4); word.setEnd(connection.firstChild, connection.textContent.length);
        return {
          cards: centeredRows('.auto-mood-cards', '.auto-mood-card'),
          ranges: centeredRows('.auto-mood-range-controls', '.auto-mood-range-controls button'),
          series: centeredRows('.auto-mood-chart-legend', '.auto-mood-chart-legend li'),
          actions: centeredRows('.auto-mood-toolbar', '.auto-mood-actions button'),
          connectionLines: word.getClientRects().length,
          styles: ['.auto-mood-range-controls button', '.auto-mood-series-toggle', '.auto-mood-actions button'].map(buttonStyle)
        };
      });
      for (const name of ['cards', 'ranges', 'series', 'actions']) assert(layout[name].every(offset => offset <= 2), `${width}px ${largeText ? '200%' : '100%'}: ${name} rows are centered`);
      if (!largeText) assert.equal(layout.connectionLines, 1, `${width}px: CONNECTION stays on one line`);
      for (const style of layout.styles.slice(1)) assert.deepEqual(style, layout.styles[0], `${width}px: buttons share the range controls' dimensions`);
      await page.getByRole('button', { name: 'Custom', exact: true }).click();
      const custom = await page.locator('.auto-mood-custom-range button').evaluate(el => {
        const style = getComputedStyle(el); return [style.minHeight, style.fontSize, style.paddingTop, style.paddingRight, style.paddingBottom, style.paddingLeft];
      });
      assert.deepEqual(custom, layout.styles[0], `${width}px: custom apply button matches`);
    }
    console.log('PASS centered dashboard controls and summary cards, including wrapped rows and enlarged text');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
