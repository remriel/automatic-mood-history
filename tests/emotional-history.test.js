const assert = require("node:assert/strict");
const core = require("../src/sentiment-core");
function record(date, text, extra = {}) {
  return { ...core.localSentiment(text), date, status: "complete", dateBasis: "created-at-local-date", sourceScope: "synthetic-scope",
    analysisVersion: core.ENGINE_VERSION, analysisSource: "local", model: core.ENGINE_VERSION, ...extra };
}
const dates = ["2030-01-01", "2030-01-03", "2030-01-10"];
const history = Object.fromEntries(dates.slice(0, 2).map(date => [date, record(date, "I feel anxious after vague feedback.")]));
let current = record(dates[2], "I feel anxious after vague feedback.");
let comparison = core.compareEmotionalHistory(current, history);
assert.equal(comparison.recurring[0].emotion, "anxious");
assert.deepEqual(comparison.recurring[0].dates, [dates[2], dates[1], dates[0]]);
assert.equal(comparison.situations[0].context, "vague feedback");
assert.equal(comparison.situations[0].evidence.length, 3);
assert.equal(comparison.situations[0].confidence, "low");
assert.equal(core.compareEmotionalHistory(current, { [dates[0]]: history[dates[0]] }).recurring.length, 0);
for (const changed of [{ sourceScope: "other" }, { dateBasis: "legacy-note-date" }, { model: "other" }, { analysisVersion: "other" }, { analysisSource: "groq" }])
  assert.equal(core.compareEmotionalHistory({ ...current, ...changed }, history), null, `incompatible comparison ${JSON.stringify(changed)}`);
assert.equal(core.compareEmotionalHistory(record("2030-03-10", "I feel sad."), history), null);
assert.equal(core.compareEmotionalHistory(current, {}), null);
assert.equal(core.compareEmotionalHistory({ ...current, analysisVersion: undefined }, history), null);
assert.equal(core.compareEmotionalHistory(current, { future: record("2030-01-11", "I feel sad.") }), null);

current = record(dates[2], "I feel calm and supported after vague feedback.");
comparison = core.compareEmotionalHistory(current, history);
assert(comparison.changes.some(item => item.dimension === "mood" && item.delta >= 2));
assert(!comparison.changes.some(item => item.dimension === "energy" || item.dimension === "connection"), "unknown baselines are not neutral");
assert.equal(comparison.situations.length, 0, "a different emotional response is not a repeated event-feeling pattern");
assert.equal(comparison.comparedDates.length, 2, "calendar gaps are not imputed");
const duplicates = { ...history, duplicate: history[dates[0]] };
assert.equal(core.compareEmotionalHistory(current, duplicates).comparedDates.length, 2);
const many = Object.fromEntries(Array.from({ length: 28 }, (_, i) => [String(i), record(`2030-01-${String(i + 1).padStart(2, "0")}`, "I feel tired.")]));
assert.equal(core.compareEmotionalHistory(record("2030-01-30", "I feel energized."), many).comparedDates.length, 14);
assert(core.buildEntryMarkdown({ ...current, sourcePaths: [], historyComparison: comparison }).includes("Compared with earlier writing"));
console.log("PASS local sparse-history changes, three-date recurrence, source/engine/basis isolation, unknown axes, unique dates and bounded observation window");
