const assert = require("assert");
const core = require("../src/sentiment-core");

const negative = core.localSentiment(
  "The synthetic sample describes feeling drained, worried, isolated, and frustrated after a difficult week.",
  "Sample stress test"
);
assert(negative.moodScore < 5);
assert(negative.connectionScore < 5);
assert(negative.emotions.includes("frustrated") || negative.emotions.includes("anxious"));
assert.strictEqual(negative.confidence, "low");

const positive = core.localSentiment(
  "The fictional sample describes a calm day with close friends and renewed hope.",
  "Sample positive reflection"
);
assert(positive.moodScore > 6);
assert(positive.connectionScore > 6);

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
  emotions: ["angry", "<invalid-markup>", "angry"],
  summary: "test",
  drivers: ["one"],
  confidence: "medium",
  confidenceReason: "test"
});
assert.strictEqual(validated.moodScore, 10);
assert.strictEqual(validated.energyScore, 1);
assert.deepStrictEqual(validated.emotions, ["angry"]);

const markdown = core.buildEntryMarkdown({
  date: "2030-03-14",
  dateBasis: "detected-note-date",
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
assert(markdown.includes('date_basis: "detected-note-date"'));
assert(markdown.includes("[[Daily/2030-03-14]]"));


const noEvidence = {
  date: "2030-03-16", status: "complete", analysisSource: "groq",
  moodScore: 3, energyScore: 3, connectionScore: 3, intensityScore: 1,
  valence: "mixed", emotions: ["confused"],
  summary: "No explicit emotional content was provided, making assessment uncertain.",
  drivers: ["No emotional signals were present."], confidence: "low",
  confidenceReason: "No content was provided for analysis, so the emotional state cannot be determined.",
  sourcePaths: [], analyzedAt: "2030-03-16T12:00:00Z"
};
assert(core.hasNoEmotionalEvidence(noEvidence));
assert(core.hasNoEmotionalEvidence({ summary: "There is no content provided for analysis." }));
assert(core.hasNoEmotionalEvidence({ confidenceReason: "The emotional state cannot be determined from this text." }));
assert(!core.hasNoEmotionalEvidence({ summary: "The writer is cautiously hopeful.", confidenceReason: "Low confidence because the note is short." }));
assert(!core.hasNoEmotionalEvidence({ summary: "The writer reports feeling neutral and tired.", confidenceReason: "No clear evidence of a positive mood." }));
const exempted = core.exemptUnscorableAssessment(noEvidence);
assert.strictEqual(noEvidence.status, "complete", "classification does not mutate its input");
assert.strictEqual(exempted.status, "insufficient");
for (const field of ["moodScore", "energyScore", "connectionScore", "intensityScore"]) assert.strictEqual(exempted[field], null);
assert.deepStrictEqual(exempted.emotions, []);
const noEvidenceMarkdown = core.buildEntryMarkdown(exempted);
assert(noEvidenceMarkdown.includes('status: "insufficient"'));
assert(noEvidenceMarkdown.includes("mood: null"));
assert(!noEvidenceMarkdown.includes("**Mood:** 3/5"));
assert(noEvidenceMarkdown.includes("No content was provided for analysis"));

const legacyScores = { moodScore: 1, energyScore: 3, connectionScore: 5, intensityScore: null };
const display = core.displayScores(legacyScores);
assert.deepEqual(display, { moodScore: 1, energyScore: 6, connectionScore: 10, intensityScore: null, scoreScale: 10 });
assert.strictEqual(legacyScores.energyScore, 3, "display conversion leaves stored scores intact");
assert.strictEqual(core.displayScores(display), display, "native 10-point results are not converted");
assert(core.buildEntryMarkdown({ ...display, status: "complete" }).includes("**Connection:** 10/10"));

console.log("automatic-mood-history core tests passed");
