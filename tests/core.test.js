const assert = require("assert");
const core = require("../src/sentiment-core");

const negative = core.localSentiment(
  "The synthetic sample describes feeling drained, worried, isolated, and frustrated after a difficult week.",
  "Sample stress test"
);
assert(negative.moodScore <= 2);
assert(negative.connectionScore <= 2);
assert(negative.emotions.includes("frustrated") || negative.emotions.includes("anxious"));
assert.strictEqual(negative.confidence, "low");

const positive = core.localSentiment(
  "The fictional sample describes a calm day with close friends and renewed hope.",
  "Sample positive reflection"
);
assert(positive.moodScore >= 4);
assert(positive.connectionScore >= 4);

assert.strictEqual(core.textForAnalysis("---\ntype: daily\n---\n![[image.png]]\n"), "");
assert.strictEqual(
  core.deduplicateParagraphs(["one\n\ntwo", "two\n\nthree"]),
  "one\n\ntwo\n\nthree"
);

const validated = core.validateAnalysis({
  moodScore: 99,
  energyScore: -5,
  connectionScore: 3,
  intensityScore: 4,
  emotions: ["angry", "not-an-emotion", "angry"],
  summary: "test",
  drivers: ["one"],
  confidence: "medium",
  confidenceReason: "test"
});
assert.strictEqual(validated.moodScore, 5);
assert.strictEqual(validated.energyScore, 1);
assert.deepStrictEqual(validated.emotions, ["angry"]);

const markdown = core.buildEntryMarkdown({
  date: "2030-03-14",
  status: "complete",
  analysisSource: "reviewed-backfill",
  model: "synthetic-test-v1",
  moodScore: 3,
  energyScore: 3,
  connectionScore: 3,
  intensityScore: 2,
  valence: "mixed",
  emotions: ["curious", "peaceful"],
  summary: "Synthetic test record.",
  drivers: ["Synthetic fixture only."],
  confidence: "low",
  confidenceReason: "Synthetic test fixture.",
  sourcePaths: ["Daily/2030-03-14.md"],
  analyzedAt: "2030-03-14T12:00:00Z"
});
assert(markdown.includes('analysis_source: "reviewed-backfill"'));
assert(markdown.includes("[[Daily/2030-03-14]]"));

console.log("automatic-mood-history core tests passed");
