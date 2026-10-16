const assert = require("node:assert/strict");
const core = require("../src/sentiment-core");
const { fixture, date, valid, priorRecord, Mood } = require("./reliability-fixture");
const reply = analysis => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(analysis) } }] });
const evidence = (dimension, quote, emotion, direction = "negative", confidence = "high") => ({ dimension, quote, emotion, direction, confidence });
const providerResult = (items = [], observations = []) => ({ ...valid,
  moodScore: 2, energyScore: 2, connectionScore: 2, intensityScore: 3, valence: "negative", emotions: ["sad"],
  insights: { version: 1, evidence: items, observations, limitations: [] } });

async function run() {
  let { p } = fixture();
  const text = "I feel sad after the cancelled visit. I need some quiet.";
  let result = p.parseGroqAnalysis(reply(providerResult([evidence("mood", "I feel sad", "sad")], [
    { kind: "need", description: "An invented hidden motive and diagnosis", quotes: ["I need some quiet."], confidence: "high" }
  ])), text);
  assert.equal(result.moodScore, 2);
  assert.equal(result.energyScore, null); assert.equal(result.connectionScore, null); assert.equal(result.intensityScore, null);
  assert.equal(result.confidence, "low", "partial coverage cannot claim global certainty");
  assert(!JSON.stringify(result).includes("invented hidden motive"));
  assert(result.drivers[0].includes("I feel sad"));
  assert.equal(result.insights.observations[0].confidence, "medium");
  assert.equal(result.insights.evidence[0].confidence, "medium", "provider high confidence is capped");

  for (const sample of ["She feels sad.", "I study sad characters.", "I do not feel sad.", 'The book says "I feel sad."', "If I felt sad."]) {
    const quote = sample.includes("I feel sad") ? "I feel sad" : "sad";
    assert.throws(() => p.parseGroqAnalysis(reply(providerResult([evidence("mood", quote, "sad")])), sample), /source evidence/, `provider attribution: ${sample}`);
  }
  assert.throws(() => p.parseGroqAnalysis(reply(providerResult([evidence("mood", "A fabricated quotation", "sad")])), text), /source evidence/);
  const wrongDirection = providerResult([evidence("mood", "I feel sad", "sad")]); wrongDirection.moodScore = 5;
  const conflictingAxis = p.parseGroqAnalysis(reply(wrongDirection), text);
  assert.equal(conflictingAxis.moodScore, null);
  assert.equal(conflictingAxis.valence, "unknown");
  assert.equal(conflictingAxis.insights.evidence.length, 1);
  assert(conflictingAxis.insights.limitations.some(item => item.includes("conflicted")));
  assert.throws(() => p.parseGroqAnalysis(reply(providerResult([evidence("mood", "I feel sad", "bipolar disorder")])), text), /diagnostic/);
  assert.throws(() => p.parseGroqAnalysis(reply(valid), text), /grounded/);
  assert.equal(p.parseGroqAnalysis(reply(valid)).moodScore, valid.moodScore, "historical result parsing remains compatible");
  for (const bad of [null, [], { version: 2 }, { version: 1, evidence: "bad" }]) {
    assert.throws(() => p.parseGroqAnalysis(reply({ ...providerResult(), insights: bad }), text));
  }
  const absent = providerResult([], [
    { kind: "need", description: "Invented need", quotes: ["I feel sad"], confidence: "high" },
    { kind: "ambivalence", description: "Invented second pole", quotes: ["I feel sad", "I feel happy"], confidence: "high" },
    { kind: "pattern", description: "Invented pattern", quotes: ["I feel sad"], confidence: "high" }
  ]);
  result = p.parseGroqAnalysis(reply(absent), text);
  assert.deepEqual(result.insights.observations, []);
  assert.equal(result.valence, "unknown");
  const bounded = core.normalizeInsights({ version: 1, evidence: Array(100).fill(evidence("mood", "I feel sad", "sad")),
    observations: Array(100).fill({ kind: "sarcasm", description: "x".repeat(10000), quotes: ["I feel sad"], confidence: "high" }), limitations: Array(100).fill("x".repeat(10000)) }, text);
  assert.equal(bounded.evidence.length, 1); assert(bounded.observations.length <= 8); assert.equal(bounded.observations[0].confidence, "low");
  assert(bounded.limitations.length <= 6 && bounded.limitations[0].length <= 240);

  // A long intellectual note must abstain rather than create invented neutral points.
  let f = fixture(); p = f.p; p.settings.enableGroq = false;
  f.disk.files.set(f.source.path, "I study sadness, loneliness and grief in literature. ".repeat(4));
  await p.analyzeDate(date);
  assert.equal(p.records[date].status, "insufficient"); assert.equal(p.records[date].moodScore, null);
  assert.equal(p.providerCalls, 0);
  assert(core.buildEntryMarkdown(p.records[date]).includes("personal emotional evidence"));
  const restarted = fixture(f.disk); await restarted.p.onload();
  assert.equal(restarted.p.records[date].moodScore, null);
  assert.equal(restarted.p.records[date].insights.version, 2);
  assert(!JSON.stringify(restarted.p.records).includes("apiKey"));

  // New insights survive prepared-result recovery and JSON storage without changing
  // legacy date identity, base score properties or existing provenance.
  f = fixture(); p = f.p; p.settings.enableGroq = false;
  f.disk.files.set(f.source.path, "I feel happy but exhausted after a long and meaningful day of work.");
  await p.analyzeDate(date); const stored = p.records[date];
  assert.equal(stored.status, "complete"); assert.equal(stored.energyScore, 1); assert.equal(stored.connectionScore, null);
  assert.equal(stored.model, core.ENGINE_VERSION); assert.equal(stored.dateBasis, "created-at-local-date");
  const reloaded = fixture(f.disk); await reloaded.p.onload();
  assert.deepEqual(reloaded.p.records[date].insights, stored.insights);
  assert(core.buildEntryMarkdown(stored).includes("Not evidenced"));

  // No previous quotes, paths, filenames or extra notes can enter a remote prompt.
  f = fixture(); p = f.p; p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  const privateMarker = "PRIOR_PRIVATE_SYNTHETIC_SENTINEL";
  p.records["2031-02-02"] = { ...priorRecord(), date: "2031-02-02", summary: privateMarker };
  f.disk.files.set(f.source.path, text);
  const requests = [];
  p.requestGroq = async payload => { requests.push(payload); const helper = require("./provider-fixture"); return reply(helper.version2(providerResult([evidence("mood", "I feel sad", "sad")]), helper.chunkFromPayload(payload))); };
  await p.analyzeDate(date);
  assert.equal(requests.length, 2, "local intensity cues trigger one dimension review without creating unsupported scores");
  assert(!JSON.stringify(requests).includes(privateMarker));
  assert(!JSON.stringify(requests).includes(f.source.path));
  assert.equal(p.records[date].analysisSource, "groq");
  assert.equal(p.records[date].energyScore, null);
  const previous = p.records[date];
  p.requestGroq = async () => reply(valid);
  assert.equal(await p.analyzeDate(date, { force: true }), false);
  assert.equal(p.records[date], previous, "provider omissions preserve existing records and remain pending");
  assert(p.runtime.pendingDates[date]);
  console.log("PASS provider source/direction checks, deterministic narrative, nullable axes, abstention persistence, backward compatibility, remote-context privacy and failure preservation");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
