const assert = require("assert");
const { chromium } = require("playwright");
const { fixtureHTML } = require("./layout-fixture");

async function inspectLayout(page, label) {
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
  const issues = await page.evaluate(() => {
    const pane = document.getElementById("pane");
    const bounds = pane.getBoundingClientRect();
    const elements = [document.documentElement, document.body, pane, ...pane.querySelectorAll("*")];
    return elements.flatMap(element => {
      if (!(element instanceof HTMLElement) && !element.classList?.contains("auto-mood-svg")) return [];
      const rect = element.getBoundingClientRect();
      if (!rect.width || !rect.height) return [];
      const name = element.className?.baseVal || element.className || element.tagName;
      const failures = [];
      if (element.clientWidth && element.scrollWidth > element.clientWidth + 1) failures.push(`${name}: scrollWidth ${element.scrollWidth} > ${element.clientWidth}`);
      if (pane.contains(element) && (rect.left < bounds.left - 1 || rect.right > bounds.right + 1)) failures.push(`${name}: outside pane bounds`);
      // Native single-line form controls have UA overflow clipping; the
      // surrounding layout must reflow, not turn an input into multiline text.
      if (element instanceof HTMLElement && !["INPUT", "TEXTAREA", "SELECT"].includes(element.tagName) && pane.contains(element) && ["hidden", "clip"].includes(getComputedStyle(element).overflowX)) failures.push(`${name}: content hidden instead of reflowed`);
      return failures;
    });
  });
  assert.deepStrictEqual(issues, [], label);
  const clippedLabels = await page.evaluate(() => Array.from(document.querySelectorAll('.auto-mood-svg text')).flatMap(text => {
    const box = text.getBBox();
    const viewport = text.ownerSVGElement.viewBox.baseVal;
    return box.x < -1 || box.x + box.width > viewport.width + 1 || box.y < -1 || box.y + box.height > viewport.height + 1 ? [text.textContent] : [];
  }));
  assert.deepStrictEqual(clippedLabels, [], `${label}: SVG labels remain inside the plot viewport`);
  await page.evaluate(() => {
    for (const el of document.querySelectorAll('.auto-mood-dashboard,.auto-mood-section,.auto-mood-chart,.auto-mood-day')) {
      el.scrollLeft = 500;
      if (el.scrollLeft !== 0) throw new Error(`${el.className} accepts horizontal scrolling`);
    }
  });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.setContent(fixtureHTML());
    assert.deepStrictEqual(errors, [], "fixture loaded without script errors");
    for (const theme of ["light", "dark"]) {
      for (const width of [240, 280, 320, 360, 390, 480, 620, 760, 1024, 1440]) {
        await page.evaluate(options => fixture.configure(options), { theme, paneWidth: width, count: 32, longText: true });
        await inspectLayout(page, `${theme} ${width}px pane inside a 1600px window`);
        assert.strictEqual(await page.locator(".auto-mood-day").count(), 32, "all days remain available");
        const pointCounts = await page.evaluate(() => ({ expected: Object.values(fixture.plugin.records).filter(r => r.dateBasis === 'created-at-local-date' && r.status === 'complete').length * 4, actual: document.querySelectorAll('.auto-mood-svg circle').length }));
        assert.strictEqual(pointCounts.actual, pointCounts.expected, "every chart series retains every valid day");
        const graph = await page.locator(".auto-mood-svg").evaluate(svg => ({ width: svg.viewBox.baseVal.width, cssWidth: svg.clientWidth, labels: svg.querySelectorAll(".date-label").length }));
        assert(Math.abs(graph.width - graph.cssWidth) <= 5, "chart redraws for its actual width");
        assert(graph.labels <= Math.max(2, Math.floor(graph.width / 70)), "dense date labels do not collide");
      }
    }
    await page.evaluate(() => {
      const records = Object.values(fixture.plugin.records).filter(r => r.dateBasis === 'created-at-local-date' && r.status === 'complete').sort((a, b) => a.date.localeCompare(b.date));
      records[0].intensityScore = null;
      records[1].intensityScore = 5;
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
      const svg = document.querySelector('.auto-mood-svg');
      const marks = [...svg.querySelectorAll('circle[data-series="intensityScore"]')];
      if (marks.length !== records.length - 1) throw new Error('Missing intensity is omitted rather than plotted as zero');
      const mark = marks[0];
      if (!mark.querySelector('title').textContent.includes(records[1].date + ': Intensity 5/5')) throw new Error('Intensity tooltip uses saved score and date');
      const top = Number(svg.querySelectorAll('.grid')[4].getAttribute('y1'));
      if (Number(mark.getAttribute('cy')) !== top) throw new Error('Intensity five aligns with the five gridline');
      const traces = [...svg.querySelectorAll('.series')];
      if (new Set(traces.map(t => t.getAttribute('stroke-dasharray'))).size !== 4) throw new Error('Series have distinct line patterns');
      if (![...document.querySelectorAll('.auto-mood-chart-legend li')].some(li => li.textContent === 'Intensity')) throw new Error('Intensity legend is visible');
      if (!svg.getAttribute('aria-label').includes('intensity')) throw new Error('Accessible chart description includes intensity');
    });
    await page.setViewportSize({ width: 640, height: 1000 });
    await page.evaluate(() => { document.body.style.zoom = '2'; fixture.configure({ paneWidth: 320, longText: true }); });
    await inspectLayout(page, "200% CSS zoom, including SVG text, in a narrow pane");
    await page.evaluate(() => { document.body.style.zoom = '1'; });
    await page.setViewportSize({ width: 1600, height: 1000 });
    for (const options of [
      { paneWidth: 280, mode: "empty" }, { paneWidth: 320, mode: "insufficient", count: 8 },
      { paneWidth: 280, count: 1 }, { paneWidth: 320, count: 365, longText: true },
      { paneWidth: 280, largeText: true, longText: true }, { paneWidth: 390, largeText: true, settingsView: true },
      { paneWidth: 280, settingsView: true }
    ]) {
      await page.evaluate(options => fixture.configure(options), options);
      await inspectLayout(page, JSON.stringify(options));
    }
    await page.evaluate(() => fixture.configure({ paneWidth: 320 }));
    await page.evaluate(() => fixture.configure({ paneWidth: 320 }));
    const recordsBefore = await page.evaluate(() => JSON.stringify(fixture.plugin.records));
    for (const [label, property] of [['Mood','moodScore'],['Energy','energyScore'],['Connection','connectionScore'],['Intensity','intensityScore']]) {
      const button = page.getByRole('button', { name: label, exact: true });
      await button.focus();
      await page.keyboard.press('Space');
      await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
      assert.equal(await button.getAttribute('aria-pressed'), 'false');
      assert.equal(await page.locator(`.auto-mood-svg [data-series="${property}"]:visible`).count(), 0, `${label} line and points hide together`);
      assert(await button.evaluate(el => el === document.activeElement), 'toggling preserves keyboard focus');
    }
    assert(await page.locator('.auto-mood-chart-empty').isVisible(), 'all-hidden state explains how to restore series');
    await inspectLayout(page, 'all four series hidden at narrow width');
    await page.evaluate(() => { fixture.plugin.refreshRenderers(); document.getElementById('pane').style.width='480px'; });
    await page.waitForTimeout(80);
    assert.equal(await page.locator('.auto-mood-svg [data-series]:visible').count(), 0, 'visibility survives refresh and resize');
    assert.equal(await page.evaluate(() => fixture.plugin.chartSeriesViews.size), 1, 'refresh disposes old chart controls');
    for (const label of ['Mood','Energy','Connection','Intensity']) {
      const button=page.getByRole('button', {name:label,exact:true});
      await button.focus();await page.keyboard.press('Enter');
      await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
      assert.equal(await button.getAttribute('aria-pressed'), 'true');
    }
    assert.equal(await page.locator('.auto-mood-svg .series:visible').count(),4);
    assert.equal(await page.evaluate(() => JSON.stringify(fixture.plugin.records)), recordsBefore, 'view toggles never alter saved scores or source records');
    assert.equal(await page.evaluate(() => fixture.calls.analyze),0,'view toggles never run analysis');
    await page.evaluate(() => { window.originalSave=fixture.plugin.savePluginData;fixture.plugin.savePluginData=async()=>{throw new Error('Fictional storage failure');}; });
    await page.getByRole('button',{name:'Mood',exact:true}).click();
    await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
    assert.equal(await page.getByRole('button',{name:'Mood',exact:true}).getAttribute('aria-pressed'),'true','save failure restores the previous visibility');
    await page.evaluate(() => { fixture.plugin.savePluginData=window.originalSave; });

    for (const [name, counter] of [["Analyze changed", "analyze"], ["Retry all with Groq", "retry"], ["Check Groq", "check"], ["Retry fallback entries", "recover"]]) {
      await page.getByRole("button", { name, exact: true }).click();
      await inspectLayout(page, `${name} busy state`);
      await page.waitForFunction(() => !fixture.plugin.activeScan && !fixture.plugin.checkingGroq);
      assert.strictEqual(await page.evaluate(key => fixture.calls[key], counter), 1);
    }
    await page.locator(".auto-mood-day-date a").first().click();
    assert((await page.evaluate(() => window.lastOpenedEntry)).endsWith("(Automatic Mood History)"), "conflict-safe entry link is preserved");
    await page.evaluate(() => { for (let i = 0; i < 5; i++) fixture.plugin.refreshRenderers(); });
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 1, "refreshes dispose old observers");
    await page.evaluate(() => fixture.configure({ mode: "empty", paneWidth: 320 }));
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 0, "empty state leaves no observer");
    await page.evaluate(() => fixture.configure({ settingsView: true, paneWidth: 280 }));
    await page.getByRole("switch", { name: "Enable Groq analysis", exact: true }).click();
    assert.strictEqual(await page.evaluate(() => fixture.plugin.settings.enableGroq), false);
    await page.getByRole("textbox", { name: "Groq model", exact: true }).fill("long-fictional-model-name");
    await inspectLayout(page, "settings after toggle and typing input");
    for (const options of [{paneWidth:240,evidence:true,count:12},{paneWidth:320,evidence:true,largeText:true,count:12}]) {
      await page.evaluate(options => { fixture.configure(options);document.querySelectorAll('.auto-mood-evidence').forEach(element=>{element.open=true;}); },options);
      await inspectLayout(page, 'expanded emotional evidence, unknown axes and historical comparisons');
      assert.equal(await page.locator('.auto-mood-evidence img,.auto-mood-evidence a,.auto-mood-evidence script,.auto-mood-evidence iframe').count(),0,'evidence remains inert text');
      assert(await page.locator('.auto-mood-evidence').count()>=12,'unscored days retain needs and uncertainty evidence');
      assert((await page.locator('.auto-mood-day-scores').first().innerText()).includes('—'),'unknown connection is not a neutral score');
      assert((await page.locator('.auto-mood-evidence').first().innerText()).includes('textual charge'),'textual intensity is distinguished from personal mood');
    }
    if(process.env.EMOTIONAL_LAYOUT_SCREENSHOT) {
      await page.evaluate(()=>fixture.configure({paneWidth:1000,evidence:true,count:3}));
      await page.screenshot({path:process.env.EMOTIONAL_LAYOUT_SCREENSHOT,fullPage:true});
    }
    await page.evaluate(() => { fixture.plugin.onunload(); });
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 0, "plugin unload disposes observers");
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartSeriesViews.size), 0, "unload disposes series controls");
    assert.deepStrictEqual(errors, [], "no browser runtime errors");
    console.log("layout: light/dark 240–1440px panes, 200% text, long text, 365 days, empty/insufficient/one-day states, buttons, links, settings, and observer cleanup passed without horizontal overflow");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
