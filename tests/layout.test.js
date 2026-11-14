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
        await page.getByRole("button", { name: "All", exact: true }).click();
        const pointCounts = await page.evaluate(() => ({ expected: Object.values(fixture.plugin.records).filter(r => r.dateBasis === 'detected-note-date' && r.status === 'complete').length * 4, actual: document.querySelectorAll('.auto-mood-svg .data-point').length }));
        assert.strictEqual(pointCounts.actual, pointCounts.expected, "every chart series retains every valid day");
        const graph = await page.locator(".auto-mood-svg").evaluate(svg => ({ width: svg.viewBox.baseVal.width, cssWidth: svg.clientWidth, labels: svg.querySelectorAll(".date-label").length }));
        assert(Math.abs(graph.width - graph.cssWidth) <= 5, "chart redraws for its actual width");
        assert(graph.labels <= Math.max(2, Math.floor(graph.width / 70)), "dense date labels do not collide");
      }
    }
    await page.evaluate(() => {
      const records = Object.values(fixture.plugin.records).filter(r => r.dateBasis === 'detected-note-date' && r.status === 'complete').sort((a, b) => a.date.localeCompare(b.date));
      records[0].intensityScore = null;
      records[1].intensityScore = 5;
      records[2].intensityScore = null;
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
      [...document.querySelectorAll('.auto-mood-range-controls button')].find(button => button.textContent === 'All').click();
      const svg = document.querySelector('.auto-mood-svg');
      const marks = [...svg.querySelectorAll('circle[data-series="intensityScore"]')];
      if (marks.length !== records.length - 2) throw new Error('Missing intensity is omitted rather than plotted as zero');
      const mark = marks[0];
      if (!mark.querySelector('title').textContent.includes(records[1].date + ': Intensity 5/5')) throw new Error('Intensity tooltip uses saved score and date');
      const top = Number(svg.querySelectorAll('.grid[data-grid="intensityScore"]')[4].getAttribute('y1'));
      if (Number(mark.getAttribute('cy')) !== top) throw new Error('Intensity five aligns with the five gridline');
      if (svg.querySelectorAll('.series-heading').length !== 4) throw new Error('Each metric has a separate labeled chart');
      if (!document.querySelector('.auto-mood-cards').textContent.includes('AVG INTENSITY')) throw new Error('Intensity average is present');
      const traces = [...svg.querySelectorAll('.series')];
      if (traces.length !== 4 || traces.some(t => getComputedStyle(t).strokeDasharray !== 'none')) throw new Error('Each series has a solid line');
      if ([...document.querySelectorAll('.auto-mood-legend-swatch')].some(swatch => getComputedStyle(swatch).borderTopStyle !== 'solid')) throw new Error('Legend swatches match the solid lines');
      const intensityPath = svg.querySelector('.series[data-series="intensityScore"]').getAttribute('d');
      if ((intensityPath.match(/M/g) || []).length !== 2) throw new Error('A missing score breaks the intensity line');
      if (![...document.querySelectorAll('.auto-mood-chart-legend li')].some(li => li.textContent === 'Intensity')) throw new Error('Intensity legend is visible');
      if (!svg.getAttribute('aria-label').includes('intensity')) throw new Error('Accessible chart description includes intensity');
      const slider = document.querySelector('.auto-mood-day-slider');
      slider.value = '2';
      slider.dispatchEvent(new Event('input', { bubbles: true }));
      if (!document.querySelector('.auto-mood-readout-value[data-metric="intensityScore"]').textContent.includes('—')) throw new Error('Missing selected score is shown in the readout');
      if (svg.querySelectorAll('.selected-point').length !== 3) throw new Error('Missing score has no selected point');
    });
    await page.evaluate(() => {
      fixture.configure({ paneWidth: 680, count: 6 });
      const records = Object.values(fixture.plugin.records);
      const excludedDate = records[0].date;
      records[0].summary = "No explicit emotional content was provided, making assessment uncertain.";
      records[0].confidenceReason = "No content was provided for analysis, so the emotional state cannot be determined.";
      fixture.plugin.records = fixture.plugin.validateRecords(fixture.plugin.records);
      fixture.plugin.renderDashboard(document.getElementById("dashboard"));
      const marks = [...document.querySelectorAll(".auto-mood-svg .data-point")];
      if (marks.length !== 20) throw new Error("Exempt date must have zero chart points");
      if (marks.some(mark => mark.querySelector("title")?.textContent.includes(excludedDate))) throw new Error("Exempt date plotted");
      if (!document.querySelector(".auto-mood-insufficient")) throw new Error("Exempt date must show no scores in the history");
      if (!document.querySelector(".auto-mood-cards")?.textContent.includes("5")) throw new Error("Scored count must exclude exempt date");
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
    // Check inclusive calendar boundaries, default selection and unchanged history.
    await page.evaluate(() => {
      fixture.configure({ paneWidth: 640, count: 10 });
      const values = Object.values(fixture.plugin.records);
      const dates = ['2099-01-31', '2099-02-01', '2099-02-02', '2099-03-18', '2099-03-19', '2099-03-20', '2099-03-25', '2099-03-26', '2099-03-27', '2099-04-01'];
      fixture.plugin.records = Object.fromEntries(values.map((record, i) => [dates[i], { ...record, date: dates[i], dateBasis: 'detected-note-date', status: 'complete' }]));
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
    });
    const rangeRecordsBefore = await page.evaluate(() => JSON.stringify(fixture.plugin.records));
    const historyBefore = await page.locator('.auto-mood-day').count();
    const windowDates = {
      '7 days': ['2099-03-26', '2099-03-27', '2099-04-01'],
      '14 days': ['2099-03-19', '2099-03-20', '2099-03-25', '2099-03-26', '2099-03-27', '2099-04-01'],
      '60 days': ['2099-02-01', '2099-02-02', '2099-03-18', '2099-03-19', '2099-03-20', '2099-03-25', '2099-03-26', '2099-03-27', '2099-04-01']
    };
    const windowCards = {
      '7 days': ['3', '4.0', '2.7', '2.0', '3.3'],
      '14 days': ['6', '3.3', '2.8', '3.0', '2.7'],
      '30 days': ['7', '3.4', '2.6', '2.9', '3.0'],
      '60 days': ['9', '3.2', '3.0', '2.9', '3.1'],
      '90 days': ['10', '3.0', '3.0', '3.0', '3.0'],
      '1 year': ['10', '3.0', '3.0', '3.0', '3.0'],
      'All': ['10', '3.0', '3.0', '3.0', '3.0']
    };
    const chartDates = () => page.locator('.auto-mood-svg circle[data-series="moodScore"]').evaluateAll(nodes => nodes.map(node => node.querySelector('title').textContent.slice(0, 10)));
    const cardValues = () => page.locator('.auto-mood-card-value').allTextContents();
    assert.equal(await page.getByRole('button', { name: '14 days', exact: true }).getAttribute('aria-pressed'), 'true', '14 days is selected on opening');
    assert.deepStrictEqual(await chartDates(), windowDates['14 days'], 'default includes the 14-day boundary');
    assert.deepStrictEqual(await cardValues(), windowCards['14 days'], 'default summary reflects the 14-day window');
    for (const label of ['7 days', '14 days', '30 days', '60 days', '90 days', '1 year', 'All']) {
      await page.getByRole('button', { name: label, exact: true }).click();
      assert.equal(await page.getByRole('button', { name: label, exact: true }).getAttribute('aria-pressed'), 'true');
      assert.equal(await page.locator('.auto-mood-range-controls button[aria-pressed="true"]').count(), 1, 'only the selected window is pressed');
      if (windowDates[label]) assert.deepStrictEqual(await chartDates(), windowDates[label], `${label} includes its boundary and excludes the previous day`);
      assert.deepStrictEqual(await cardValues(), windowCards[label], `${label} summary uses the same records as the chart`);
      assert.equal(await page.locator('.auto-mood-bar-count').first().textContent(), windowCards[label][0], `${label} emotions use the same recorded days`);
      assert.equal(await page.getByRole('slider', { name: 'Explore a recorded day' }).getAttribute('aria-valuetext'), '2099-04-01');
    }
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByLabel('Start date', { exact: true }).fill('2099-03-25');
    await page.getByLabel('End date', { exact: true }).fill('2099-03-27');
    await page.getByRole('button', { name: 'Apply range', exact: true }).click();
    assert.deepStrictEqual(await chartDates(), ['2099-03-25', '2099-03-26', '2099-03-27'], 'custom boundaries are inclusive');
    assert.equal((await cardValues())[0], '3');
    assert.equal(await page.locator('.auto-mood-bar-count').first().textContent(), '3', 'custom range filters emotion counts');
    assert.equal(await page.locator('.auto-mood-composition').count(), 1, 'composition chart follows the range');
    const periods = await page.locator('.auto-mood-composition-chart rect').evaluateAll(nodes => {
      const sums = {}; for (const node of nodes) sums[node.dataset.period] = (sums[node.dataset.period] || 0) + Number(node.dataset.share); return sums;
    });
    assert.deepStrictEqual(Object.keys(periods), ['2099-03-25', '2099-03-26', '2099-03-27']);
    assert(Object.values(periods).every(sum => Math.abs(sum - 100) < 0.00001), 'composition normalizes each recorded period to 100%');

    await page.getByLabel('Start date', { exact: true }).fill('2099-04-01');
    await page.getByRole('button', { name: 'Apply range', exact: true }).click();
    assert(await page.locator('.auto-mood-range-error').textContent(), 'reversed range reports an error');
    assert.deepStrictEqual(await chartDates(), ['2099-03-25', '2099-03-26', '2099-03-27'], 'invalid input keeps the applied range');
    await page.getByLabel('Start date', { exact: true }).fill('2080-01-01');
    await page.getByLabel('End date', { exact: true }).fill('2080-01-02');
    await page.getByRole('button', { name: 'Apply range', exact: true }).click();
    assert.equal((await cardValues())[0], '0');
    assert.equal(await page.locator('.auto-mood-range-emotions .auto-mood-bar-row').count(), 0, 'empty range clears emotions');
    assert.equal(await page.locator('.auto-mood-composition').count(), 0, 'empty range clears composition');
    assert.equal(await page.locator('.auto-mood-svg .data-point').count(), 0);
    assert.equal(await page.getByRole('slider', { name: 'Explore a recorded day' }).isDisabled(), true);
    await page.getByRole('button', { name: 'All', exact: true }).click();
    assert.deepStrictEqual(await cardValues(), windowCards.All, 'preset restores chart and summaries after an empty custom range');
    assert.equal(await page.evaluate(() => JSON.stringify(fixture.plugin.records)), rangeRecordsBefore, 'changing range does not alter records');
    assert.equal(await page.locator('.auto-mood-day').count(), historyBefore, 'changing range does not filter history');
    await page.evaluate(() => fixture.plugin.renderDashboard(document.getElementById('dashboard')));
    assert.equal(await page.getByRole('button', { name: '14 days', exact: true }).getAttribute('aria-pressed'), 'true', 'opening the dashboard again restores the default');
    assert.deepStrictEqual(await chartDates(), windowDates['14 days']);
    assert.deepStrictEqual(await cardValues(), windowCards['14 days']);
    await page.evaluate(() => {
      for (const date of ['2099-03-26', '2099-03-27']) fixture.plugin.records[date].energyScore = null;
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
    });
    await page.getByRole('button', { name: '7 days', exact: true }).click();
    assert.equal((await cardValues())[2], '2.0', 'missing scores are excluded from the average');
    await page.evaluate(() => {
      fixture.plugin.records['2099-04-01'].energyScore = null;
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
    });
    await page.getByRole('button', { name: '7 days', exact: true }).click();
    assert.equal((await cardValues())[2], '—', 'a metric without scores in the selected window has no average');
    // Irregular calendar gaps and window boundaries must not become equally spaced observations.
    await page.evaluate(() => {
      fixture.configure({ paneWidth: 640, count: 4 });
      const values = Object.values(fixture.plugin.records);
      const dates = ['2099-01-01', '2099-01-02', '2099-01-11', '2099-04-01'];
      fixture.plugin.records = Object.fromEntries(values.map((record, i) => [dates[i], { ...record, date: dates[i], dateBasis: 'detected-note-date', status: 'complete' }]));
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
      [...document.querySelectorAll('.auto-mood-range-controls button')].find(button => button.textContent === 'All').click();
    });
    assert.equal(await page.locator('.auto-mood-card').filter({ hasText: 'AVG INTENSITY' }).locator('.auto-mood-card-value').innerText(), '3.5', 'intensity card averages scored records');
    const positions = await page.locator('.auto-mood-svg circle[data-series="moodScore"]').evaluateAll(nodes => nodes.map(node => Number(node.getAttribute('cx'))));
    assert(Math.abs((positions[2] - positions[1]) / (positions[1] - positions[0]) - 9) < .01, 'calendar gaps use proportional spacing');
    const slider = page.getByRole('slider', { name: 'Explore a recorded day' });
    await slider.focus();
    await page.keyboard.press('Home');
    assert.equal(await slider.getAttribute('aria-valuetext'), '2099-01-01');
    assert((await page.locator('.auto-mood-day-readout').innerText()).includes('Mood 1/5'), 'keyboard selection exposes values');
    assert.equal(await page.locator('.auto-mood-svg .selected-score').first().textContent(), '1/5', 'each plot labels the selected score');
    const selectedX = await page.locator('.auto-mood-svg .selected-point').first().getAttribute('cx');
    assert.equal(Number(selectedX), positions[0], 'selected point follows the keyboard-selected day');
    await page.getByRole('button', { name: '90 days', exact: true }).click();
    assert.equal(await page.locator('.auto-mood-svg circle[data-series="moodScore"]').count(), 3, 'window includes its 90-day boundary and excludes older records');
    assert.equal(await slider.getAttribute('aria-valuetext'), '2099-04-01');
    await page.getByRole('button', { name: '30 days', exact: true }).click();
    assert.equal(await page.locator('.auto-mood-svg circle[data-series="moodScore"]').count(), 1);
    assert(await slider.isDisabled(), 'one-day window has a disabled selector');
    await page.getByRole('button', { name: 'All', exact: true }).click();
    assert.equal(await page.locator('.auto-mood-svg circle[data-series="moodScore"]').count(), 4);
    await page.locator('.auto-mood-svg').click({ position: { x: 32, y: 80 } });
    assert.equal(await slider.getAttribute('aria-valuetext'), '2099-01-01', 'chart selection picks the nearest recorded day');
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

    // The seven leaders are chosen across the selected range, and each
    // period's denominator contains only those displayed labels.
    await page.evaluate(() => {
      fixture.configure({ paneWidth: 320, count: 10 });
      const emotions = [
        ...Array.from({ length: 5 }, () => ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot']),
        ['golf'], ['golf'], ['golf', 'hotel'], ['hotel'], ['india', 'juliet']
      ];
      Object.values(fixture.plugin.records).forEach((record, index) => {
        record.dateBasis = 'detected-note-date'; record.status = 'complete';
        record.moodScore = 3; record.emotions = emotions[index];
      });
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
    });
    const compositionRecordsBefore = await page.evaluate(() => JSON.stringify(fixture.plugin.records));
    assert.deepStrictEqual(await page.locator('.auto-mood-composition-legend li').allTextContents(),
      ['alpha', 'bravo', 'charlie', 'delta', 'echo', 'foxtrot', 'golf'], 'only seven leaders appear in the legend');
    assert(!(await page.locator('.auto-mood-composition').textContent()).includes('Other emotions'), 'no grouped category is displayed');
    const dayEight = page.locator('.auto-mood-composition-chart rect[data-period="2099-01-08"]');
    assert.equal(await dayEight.count(), 1, 'a less common label is excluded from the period');
    assert.equal(await dayEight.first().getAttribute('data-emotion'), 'golf');
    assert.equal(Number(await dayEight.first().getAttribute('data-share')), 100, 'share is normalized among displayed labels');
    assert.equal(await page.locator('.auto-mood-composition-chart rect[data-period="2099-01-10"]').count(), 0, 'a day with only excluded emotions is blank');
    assert((await page.locator('.auto-mood-composition-details').textContent()).includes('2099-01-10: No top-seven emotions recorded.'), 'blank period is described accurately');
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByLabel('Start date', { exact: true }).fill('2099-01-08');
    await page.getByLabel('End date', { exact: true }).fill('2099-01-10');
    await page.getByRole('button', { name: 'Apply range', exact: true }).click();
    assert.deepStrictEqual(await page.locator('.auto-mood-composition-legend li').allTextContents(),
      ['hotel', 'golf', 'india', 'juliet'], 'leaders are recalculated for a custom range with fewer than seven labels');
    assert.equal(await page.locator('.auto-mood-composition-chart rect[data-period="2099-01-08"]').count(), 2);
    assert.equal(await page.evaluate(() => JSON.stringify(fixture.plugin.records)), compositionRecordsBefore, 'composition changes do not alter saved records');
    await inspectLayout(page, 'top-seven composition at narrow width');
    await page.evaluate(() => fixture.configure({ paneWidth: 320 }));

    // Moving averages scale with the selected calendar range.
    // The boundary is inclusive, missing scores are excluded, and each
    // calculated point needs at least two observed scores in its window.
    await page.evaluate(() => {
      fixture.configure({ paneWidth: 640, count: 7 });
      const values = Object.values(fixture.plugin.records);
      const dates = ['2099-01-01', '2099-01-02', '2099-01-07', '2099-01-08', '2099-01-09', '2099-01-10', '2099-01-18'];
      const scores = [1, 2, 3, 4, null, 5, 2];
      fixture.plugin.records = Object.fromEntries(values.map((record, index) => [dates[index], {
        ...record, date: dates[index], dateBasis: 'detected-note-date', status: 'complete',
        moodScore: 3, energyScore: scores[index]
      }]));
      fixture.plugin.renderDashboard(document.getElementById('dashboard'));
    });
    const movingRecordsBefore = await page.evaluate(() => JSON.stringify(fixture.plugin.records));
    const averageToggle = page.locator('.auto-mood-average-toggle');
    assert.equal(await averageToggle.getAttribute('aria-pressed'), 'true', 'moving average is visible by default');
    await page.getByRole('button', { name: 'All', exact: true }).click();
    assert.equal(await averageToggle.innerText(), '4-day moving average');
    const averagePoints = () => page.locator('.moving-average-point[data-series="energyScore"]').evaluateAll(nodes =>
      nodes.map(node => [node.getAttribute('data-date'), Number(node.getAttribute('data-average'))]));
    assert.deepStrictEqual(await averagePoints(), [
      ['2099-01-02', 1.5], ['2099-01-08', 3.5], ['2099-01-10', 4]
    ], 'all-history average uses a four-day calendar window and excludes missing scores');
    assert.equal(await page.locator('.moving-average-path[data-series="energyScore"]').getAttribute('stroke-dasharray'), '6 4');
    await page.getByRole('slider', { name: 'Explore a recorded day' }).evaluate(slider => {
      slider.value = '3'; slider.dispatchEvent(new Event('input', { bubbles: true }));
    });
    assert((await page.locator('[data-average-for="energyScore"]').innerText()).includes('3.5/5'), 'selected day announces its average');
    await averageToggle.click();
    assert.equal(await averageToggle.getAttribute('aria-pressed'), 'false');
    assert.equal(await page.locator('.moving-average-path').count(), 0, 'toggle hides all moving averages');
    assert.equal(await page.locator('[data-average-for]').count(), 0);
    await averageToggle.click();
    assert.deepStrictEqual(await averagePoints(), [
      ['2099-01-02', 1.5], ['2099-01-08', 3.5], ['2099-01-10', 4]
    ]);
    await page.getByRole('button', { name: 'Energy', exact: true }).click();
    await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
    assert.equal(await page.locator('.moving-average-point[data-series="energyScore"]:visible').count(), 0, 'hiding a series also hides its average');
    await page.getByRole('button', { name: 'Energy', exact: true }).click();
    await page.waitForFunction(() => !fixture.plugin.savingChartVisibility);
    await page.getByRole('button', { name: '7 days', exact: true }).click();
    assert.deepStrictEqual(await averagePoints(), [], 'a window with only one score has no moving average');
    await page.getByRole('button', { name: 'Custom', exact: true }).click();
    await page.getByLabel('Start date', { exact: true }).fill('2099-01-07');
    await page.getByLabel('End date', { exact: true }).fill('2099-01-10');
    await page.getByRole('button', { name: 'Apply range', exact: true }).click();
    assert.equal(await averageToggle.innerText(), '2-day moving average');
    assert.deepStrictEqual(await averagePoints(), [['2099-01-08', 3.5]], 'custom ranges do not borrow scores from outside the selected dates');
    assert.equal(await page.evaluate(() => JSON.stringify(fixture.plugin.records)), movingRecordsBefore, 'moving averages do not modify records');
    await inspectLayout(page, 'moving average with a custom range');
    await page.evaluate(() => fixture.configure({ paneWidth: 320 }));

    for (const [name, counter] of [["Analyze changed", "analyze"], ["Retry all with Groq", "retry"], ["Check Groq", "check"], ["Retry fallback entries", "recover"]]) {
      await page.getByRole("button", { name, exact: true }).click();
      await inspectLayout(page, `${name} busy state`);
      await page.waitForFunction(() => !fixture.plugin.activeScan && !fixture.plugin.checkingGroq);
      assert.strictEqual(await page.evaluate(key => fixture.calls[key], counter), 1);
    }
    await page.locator(".auto-mood-day-date a").first().click();
    assert((await page.evaluate(() => window.lastOpenedEntry)).endsWith("(Automatic Mood History)"), "conflict-safe entry link is preserved");
    await page.evaluate(() => { for (let i = 0; i < 5; i++) fixture.plugin.refreshRenderers(); });
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 2, "refreshes dispose old observers");
    await page.evaluate(() => fixture.configure({ mode: "empty", paneWidth: 320 }));
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 0, "empty state leaves no observer");
    await page.evaluate(() => fixture.configure({ settingsView: true, paneWidth: 280 }));
    await page.getByRole("switch", { name: "Enable Groq analysis", exact: true }).click();
    assert.strictEqual(await page.evaluate(() => fixture.plugin.settings.enableGroq), false);
    await page.getByRole("textbox", { name: "Groq model", exact: true }).fill("long-fictional-model-name");
    await inspectLayout(page, "settings after toggle and typing input");
    await page.evaluate(() => { fixture.plugin.onunload(); });
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartObservers.size), 0, "plugin unload disposes observers");
    assert.strictEqual(await page.evaluate(() => fixture.plugin.chartSeriesViews.size), 0, "unload disposes series controls");
    assert.deepStrictEqual(errors, [], "no browser runtime errors");
    console.log("layout: light/dark 240–1440px panes, 200% text, long text, 365 days, empty/insufficient/one-day states, buttons, links, settings, and observer cleanup passed without horizontal overflow");
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
