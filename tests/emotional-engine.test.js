const assert = require("node:assert/strict");
const { localSentiment, textForAnalysis, buildEntryMarkdown } = require("../src/sentiment-core");
const { synthetic, publicJournals, violations } = require("./fixtures/emotional-cases");
const failures = [];
for (const sample of [...synthetic, ...publicJournals]) {
  const result = localSentiment(sample.text);
  failures.push(...violations(result, sample.expected).map(message => `${sample.id}: ${message}`));
  assert.equal(result.confidence, "low");
  assert(result.insights.evidence.length <= 16);
  assert(result.insights.observations.length <= 8);
  for (const item of result.insights.evidence) {
    assert.equal(sample.text.slice(item.start, item.end), item.quote, `${sample.id}: exact evidence span`);
    assert(item.quote.length <= 240);
  }
  for (const item of result.insights.observations) for (const quote of item.quotes) assert(sample.text.includes(quote));
}
if (failures.length) console.error(failures.join("\n"));
assert.equal(failures.length, 0, "challenge corpus constraints");
for (const emotion of ["sad", "happy", "anxious", "lonely", "exhausted", "supported"]) {
  const direct = localSentiment(`I feel ${emotion}.`);
  for (const transformed of [`She feels ${emotion}.`, `I study ${emotion} characters.`, `I do not feel ${emotion}.`, `If I felt ${emotion}.`, `The book says "I feel ${emotion}."`]) {
    const result = localSentiment(transformed);
    assert.equal(result.insights.evidence.length, 0, transformed);
  }
  const repeated = localSentiment(`I feel ${emotion}. `.repeat(250));
  for (const axis of ["moodScore", "energyScore", "connectionScore", "intensityScore"]) assert.equal(repeated[axis], direct[axis], `${emotion}: repetition invariance`);
}
const raw = '> I feel hopeless and sad.\n\n`I am happy`\n\nI feel calm.';
assert.equal(localSentiment(textForAnalysis(raw)).moodScore, 4);
const positive = localSentiment("I feel happy.");
const crowded = localSentiment(Array.from({ length: 20 }, (_, i) => `I feel anxious after event ${i}.`).join(" ") + " I feel happy but sad.");
assert(crowded.insights.observations.some(item => item.kind === "ambivalence"), "high-priority nuance survives many trigger observations");
const decoys = localSentiment('I feel happy. '+ 'The paper discusses sad, hopeless and lonely characters. '.repeat(200));
assert.equal(decoys.moodScore, positive.moodScore);
assert.equal(decoys.intensityScore, positive.intensityScore);
const hostile = localSentiment('I feel sad after seeing [an image](https://example.invalid).');
const markdown = buildEntryMarkdown({ ...hostile, date: "2030-01-01", sourcePaths: [], status: "complete" });
assert(!markdown.includes('[an image](https://'));
console.log(`PASS ${synthetic.length} synthetic + ${publicJournals.length} public journal constraints; attribution counterfactuals, source spans, repetition/decoy invariants and safe serialization`);
