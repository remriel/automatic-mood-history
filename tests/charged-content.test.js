const assert = require("node:assert/strict");
const core = require("../src/sentiment-core");
const { fixture, Mood, valid, date } = require("./reliability-fixture");
const reply = value => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });
const quote = "They turn every independent choice into a betrayal, until even having an opinion becomes an offense.";
const signal = (basis = "textual", dimension = "intensity") => ({ dimension, basis, quote, emotion: "indignation", direction: "negative", confidence: "medium" });
const result = (evidence = [signal()]) => ({ ...valid, moodScore: null, energyScore: null, connectionScore: null, intensityScore: 4,
  valence: "unknown", emotions: ["indignation"], insights: { version: 1, evidence, observations: [], limitations: [] } });

async function run() {
  let { p } = fixture();
  let analysis = p.parseGroqAnalysis(reply(result()), quote);
  assert.equal(analysis.intensityScore, 4);
  for (const axis of ["mood", "energy", "connection"]) assert.equal(analysis[`${axis}Score`], null);
  assert.equal(analysis.insights.evidence[0].basis, "textual");
  assert(analysis.summary.includes("personal mood, energy and connection are not established"));
  assert(analysis.drivers[0].startsWith("Textual charge:"));
  assert.deepEqual(p.parseGroqAnalysis(reply({ ...result(), emotions: [] }), quote).emotions, ["indignation"], "validated labels survive omission from the redundant top-level tag array");
  const entry = core.buildEntryMarkdown({ ...analysis, date, status: "complete", sourcePaths: [] });
  assert(entry.includes("textual charge"));
  assert(entry.includes("**Mood:** Not evidenced"));
  assert.throws(() => p.parseGroqAnalysis(reply(result([signal("textual", "mood")])), quote), /evidence fields/);
  assert.throws(() => p.parseGroqAnalysis(reply(result([signal("invented")])), quote), /evidence fields/);
  assert.throws(() => p.parseGroqAnalysis(reply(result([{ ...signal(), quote: "Fabricated source evidence" }])), quote), /source evidence/);

  // A common JSON-mode shape error is repaired without inventing containers,
  // removing conflicting claims, weakening quotation checks or changing scores.
  const misplaced = result();
  misplaced.observations = misplaced.insights.observations;
  misplaced.limitations = misplaced.insights.limitations;
  delete misplaced.insights.observations; delete misplaced.insights.limitations;
  assert.equal(p.parseGroqAnalysis(reply(misplaced), quote).intensityScore, 4);
  const conflicting = result(); conflicting.limitations = ["conflicting value"];
  assert.throws(() => p.parseGroqAnalysis(reply(conflicting), quote), /conflicting/);
  const missing = result(); delete missing.insights.limitations;
  assert.throws(() => p.parseGroqAnalysis(reply(missing), quote), /evidence fields/);
  const conflictedScore = { ...result([{ ...signal("personal", "energy"), direction: "positive" }, signal()]), energyScore: 1 };
  const retained = p.parseGroqAnalysis(reply(conflictedScore), quote);
  assert.equal(retained.energyScore, null);
  assert.equal(retained.intensityScore, 4);
  assert.equal(retained.insights.evidence.length, 2);
  assert(retained.insights.limitations.some(item => item.startsWith("energy:")));

  // Indirect, second-person wording receives the semantic review even when
  // local personal-affect rules find nothing. A neutral definition can abstain.
  p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  const requests = [];
  p.requestGroq = async payload => { requests.push(payload); return reply(result(requests.length === 1 ? [] : [signal()])); };
  analysis = await p.analyzeWithGroq(date, quote);
  assert.equal(requests.length, 2);
  assert(requests[1].messages[1].content.includes("charged textual content"));
  assert.equal(analysis.intensityScore, 4);
  let calls = 0; p.requestGroq = async () => { calls++; return reply(result([])); };
  analysis = await p.analyzeWithGroq(date, "The glossary defines an emotion as a subjective experience.");
  assert.equal(calls, 2); assert.equal(analysis.intensityScore, null);
  const cancelled = fixture().p; cancelled.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  let cancelledCalls = 0;
  cancelled.requestGroq = async () => { cancelledCalls++; cancelled.settings.enableGroq = false; return reply(result([])); };
  await assert.rejects(cancelled.analyzeWithGroq(date, quote), error => error.code === "analysis_cancelled");
  assert.equal(cancelledCalls, 1, "opt-out cancels the semantic review before another request");

  // Later format attempts get feedback after invalid output. Direction
  // conflicts omit the affected axis, retaining other grounded content.
  calls = 0;
  const directQuote = "I feel energized after resting.";
  const direct = { ...result([{ dimension: "energy", basis: "personal", quote: directQuote, emotion: "energized", direction: "positive", confidence: "medium" }]), energyScore: 4 };
  p.requestGroq = async payload => {
    calls++;
    if (calls === 1) return reply({ ...direct, insights: { ...direct.insights, limitations: "invalid container" } });
    assert(payload.messages[1].content.includes("previous response failed validation"));
    return reply(direct);
  };
  assert.equal((await p.analyzeWithGroq(date, directQuote)).energyScore, 4);
  assert.equal(calls, 3, "format fallback and per-dimension review share the bounded request allowance");

  // Actual persistence uses the provider result, keeps personal axes null and
  // preserves textual basis across restart. Neutral and failed outputs retain
  // the existing reliability behavior.
  const f = fixture(); p = f.p;
  f.disk.files.set(f.source.path, quote);
  p.analyzeWithGroq = async (_date, text, options) => analysis = p.parseGroqAnalysis(reply(require("./provider-fixture").version2(result(), options.chunk)), text, options);
  await p.analyzeDate(date);
  assert.equal(p.records[date].status, "complete");
  assert.equal(p.records[date].moodScore, null);
  const reloaded = fixture(f.disk); await reloaded.p.onload();
  assert.deepEqual(reloaded.p.records[date].insights, p.records[date].insights);

  const earlier = { ...p.records[date], date: "2031-02-02", intensityScore: 1, insights: { ...analysis.insights, evidence: [{ ...signal(), basis: "personal" }] } };
  const comparison = core.compareEmotionalHistory(p.records[date], { earlier });
  assert(!comparison.changes.some(item => item.dimension === "intensity"), "textual charge is not compared with personal intensity");
  console.log("PASS textual charge, independent personal axes, exact provenance, container repair, bounded semantic review, validation feedback, persistence and history basis isolation");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
