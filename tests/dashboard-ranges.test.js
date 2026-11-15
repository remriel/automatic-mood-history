const assert = require("node:assert/strict");
const { Mood, Element } = require("./dashboard-dom-fixture");

const plugin = new Mood();
plugin.settings = { entryOutput: "none", outputFolder: "Mood History", enableGroq: false, autoAnalyze: false };
plugin.runtime = {}; plugin.chartObservers = new Map(); plugin.renderContainers = new Set(); plugin.app = {};
let savedRange;
plugin.savePluginData = async () => { savedRange = JSON.parse(JSON.stringify(plugin.runtime.lastDashboardRange)); };
plugin.records = {};
const day = 86400000, latest = Date.parse("2030-12-31T00:00:00Z");
const dateAt = offset => new Date(latest - offset * day).toISOString().slice(0, 10);
for (const [index, offset] of [400, 364, 180, 179, 89, 59, 29, 13, 7, 6, 0].entries()) {
  const date = dateAt(offset);
  plugin.records[date] = { date, status: "complete", dateBasis: "detected-note-date", moodScore: index % 5 + 1,
    energyScore: 3, connectionScore: 4, intensityScore: 2, emotions: ["joy"], summary: "Fictional", analysisSource: "local" };
}
const root = new Element(); root.rootConnected = true; plugin.renderContainers.add(root); plugin.renderDashboard(root);
const nodes = () => root.walk();
const byClass = name => nodes().filter(el => el.classList.contains(name));
const button = label => nodes().find(el => el.tagName === "button" && el.textContent === label);
const click = label => { assert(button(label), `missing ${label}`); button(label).trigger("click"); };
const cards = () => byClass("auto-mood-card-value").map(el => el.textContent);
const chart = () => nodes().filter(el => el.tagName === "circle" && el.classList.contains("data-point") && el.getAttribute("data-series") === "moodScore");
const composition = () => byClass("auto-mood-composition-chart")[0];
const marks = () => composition().walk().filter(el => el.tagName === "rect");
const active = () => nodes().filter(el => el.tagName === "button" && el.getAttribute("aria-pressed") === "true" && el.parentElement?.classList.contains("auto-mood-range-controls")).map(el => el.textContent);
const activeIn = element => element.walk().filter(el => el.tagName === "button" && el.getAttribute("aria-pressed") === "true" && el.parentElement?.classList.contains("auto-mood-range-controls")).map(el => el.textContent);
assert.deepEqual(active(), ["14 days"]);
for (const [label, span] of [["7 days", 7], ["14 days", 14], ["30 days", 30], ["60 days", 60], ["90 days", 90], ["180 days", 180], ["1 year", 365], ["All", 0]]) {
  click(label);
  const visible = Object.values(plugin.records).filter(record => !span || record.date >= dateAt(span - 1));
  assert.deepEqual(active(), [label], `${label} is selected`);
  assert.equal(Number(cards()[0]), visible.length, `${label} updates the scored-days card`);
  assert.equal(Number(cards()[1]), Number((visible.reduce((sum, record) => sum + record.moodScore, 0) / visible.length).toFixed(1)), `${label} updates averages`);
  assert.equal(chart().length, visible.length, `${label} updates the trend chart`);
  assert(marks().some(rect => rect.getAttribute("data-emotion") === "joy"), `${label} updates composition`);
  if (span && span <= 90) {
    const columns = [...new Map(marks().map(rect => [Number(rect.getAttribute("data-column")), rect])).entries()]
      .sort(([a], [b]) => a - b).map(([, rect]) => rect);
    assert.equal(columns.length, span, `${label} has a column for every calendar day`);
    for (let i = 1; i < columns.length; i++) {
      const previousEnd = Number(columns[i - 1].getAttribute("x")) + Number(columns[i - 1].getAttribute("width"));
      assert(Math.abs(Number(columns[i].getAttribute("x")) - previousEnd) < 1e-6, `${label} has no gap between columns`);
    }
  }
  if (span === 180) {
    assert.equal(marks().length, 26, "180 days creates 26 seven-day periods including a partial final period");
    assert(marks().some(rect => rect.getAttribute("data-empty") === "true"), "missing weeks are gray placeholders");
    assert.equal(marks()[0].getAttribute("data-period"), dateAt(179));
    assert(chart().some(circle => circle.textContent.includes(dateAt(179))), "the 180-day boundary is inclusive");
    assert(!chart().some(circle => circle.textContent.includes(dateAt(180))), "the day before the boundary is excluded");
  }
}
// All keeps its selection and refreshes the card and plotted points after a source update.
const extra = dateAt(401); plugin.records[extra] = { ...plugin.records[dateAt(0)], date: extra };
plugin.refreshRenderers();
assert.deepEqual(active(), ["All"]); assert.equal(Number(cards()[0]), 12); assert.equal(chart().length, 12);
// Temporary detachment does not deregister the renderer; it receives updates before and after reattachment.
root.rootConnected = false; plugin.refreshRenderers(); assert(plugin.renderContainers.has(root));
root.rootConnected = true; plugin.records[dateAt(0)].moodScore = 5; plugin.refreshRenderers();
assert.deepEqual(active(), ["All"]); assert.equal(Number(cards()[0]), 12);
const second = new Element(); second.rootConnected = true;
plugin.renderContainers.add(second); plugin.renderDashboard(second);
root.rootConnected = false; plugin.refreshRenderers();
assert.equal(plugin.chartSeriesViews.size, 2, "redrawing a second dashboard keeps the detached dashboard's chart controls");
root.rootConnected = true; plugin.renderContainers.delete(second); plugin.disposeDashboard(second);
// Custom and invalid ranges update all components and retain valid selections across refreshes.
click("Custom");
const input = label => nodes().find(el => el.tagName === "input" && el.getAttribute("aria-label") === label);
input("Start date").value = dateAt(13); input("End date").value = dateAt(0);
let form = byClass("auto-mood-custom-range")[0]; form.trigger("submit");
assert.deepEqual(active(), ["Custom"]); assert.equal(Number(cards()[0]), 4); assert.equal(chart().length, 4);
assert.equal(marks().length, 14); assert.equal(marks().filter(x => x.getAttribute("data-empty") === "true").length, 10);
assert.deepEqual(plugin.runtime.lastDashboardRange, { custom: { start: dateAt(13), end: dateAt(0) } });
const customReopened = new Element(); customReopened.rootConnected = true; plugin.renderDashboard(customReopened);
assert.deepEqual(activeIn(customReopened), ["Custom"], "an unset default reopens the last custom range");
plugin.refreshRenderers(); assert.deepEqual(active(), ["Custom"]); assert.equal(Number(cards()[0]), 4); assert.equal(chart().length, 4);
input("Start date").value = "2031-01-01"; input("End date").value = "2030-01-01";
form = byClass("auto-mood-custom-range")[0]; form.trigger("submit");
assert(byClass("auto-mood-range-error")[0].textContent); assert.equal(Number(cards()[0]), 4);
input("Start date").value = "2028-01-01"; input("End date").value = "2028-01-02"; form.trigger("submit");
assert.equal(Number(cards()[0]), 0); assert.equal(chart().length, 0); assert.equal(marks().length, 2);
assert(marks().every(x => x.getAttribute("data-empty") === "true"));
assert(marks().every(x => x.getAttribute("fill") === "#9ca3af" && x.style.fill === "#9ca3af"), "empty periods use neutral gray even with theme overrides");
assert(byClass("auto-mood-composition-details")[0].textContent.includes("No scored records"));
click("7 days"); assert.equal(Number(cards()[0]), 2); assert.equal(chart().length, 2);
assert.deepEqual(savedRange, { days: 7 }, "last used range is queued for persistence");
const lastReopened = new Element(); lastReopened.rootConnected = true; plugin.renderDashboard(lastReopened);
assert.deepEqual(activeIn(lastReopened), ["7 days"], "an unset default reopens the last preset");
const restarted = new Mood();
restarted.settings = { ...plugin.settings, defaultRange: null };
restarted.runtime = restarted.validateRuntime({ lastDashboardRange: savedRange });
restarted.records = plugin.records; restarted.app = {}; restarted.chartObservers = new Map(); restarted.renderContainers = new Set();
const afterRestart = new Element(); afterRestart.rootConnected = true; restarted.renderDashboard(afterRestart);
assert.deepEqual(activeIn(afterRestart), ["7 days"], "saved range survives plugin reload");
plugin.settings.defaultRange = 30;
const fixedReopened = new Element(); fixedReopened.rootConnected = true; plugin.renderDashboard(fixedReopened);
assert.deepEqual(activeIn(fixedReopened), ["30 days"], "an explicit opening range overrides the last used range");
plugin.settings.defaultRange = null;
assert.deepEqual(plugin.validateSettings({ defaultRange: 90 }).defaultRange, 90);
assert.equal(plugin.validateSettings({ defaultRange: 15 }).defaultRange, null);
console.log("PASS all dashboard ranges, live redraws, temporary detachment, custom form and complete composition periods");
