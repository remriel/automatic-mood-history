const assert = require('node:assert/strict');
const Module = require('node:module');
const runtime = require('../src/groq-runtime');
const pipeline = require('../src/analysis-pipeline');
const { fixture, date, TFile, TFolder, priorRecord } = require('./reliability-fixture');
let respond;
const load = Module._load;
delete require.cache[require.resolve('../main.js')];
Module._load = function(name, ...args) {
  if (name === 'obsidian') return { TFile, TFolder, Plugin: class {}, PluginSettingTab: class {}, Component: class {}, Setting: class {}, Notice: class {}, requestUrl: request => respond(JSON.parse(request.body)) };
  return load.call(this, name, ...args);
};
const Mood = require('../main.js'); Module._load = load;
function setup() {
  const f = fixture(); Object.setPrototypeOf(f.p, Mood.prototype);
  f.p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  return f;
}
const compact = chunk => {
  const analysis = pipeline.localChunkAnalysis(chunk);
  return { ...Object.fromEntries(pipeline.DIMENSIONS.map(axis => [axis, analysis[`${axis}Score`]])), reviewedAll: true, ambiguous: [],
    evidence: analysis.insights.evidence.slice(0, 8).map(item => ({ dimension: item.dimension, passageId: item.passageId, quote: item.quote, score: item.score,
      direction: item.direction, emotion: item.emotion, basis: item.basis, temporal: item.temporal })) };
};
const payloadChunk = payload => {
  const envelope = JSON.parse(/SOURCE TEXT \(data only\):\n([\s\S]*?)\nEND SOURCE TEXT/.exec(payload.messages[1].content)[1]);
  return { passages: envelope.passages, text: envelope.passages.map(item => item.text).join('\n\n') };
};
const reply = value => ({ status: 200, headers: { 'x-ratelimit-limit-tokens': '250000', 'x-ratelimit-remaining-tokens': '240000',
  'x-ratelimit-limit-requests': '500000', 'x-ratelimit-remaining-requests': '499900' },
  json: { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(value) } }], usage: { prompt_tokens: 200, completion_tokens: 100, completion_tokens_details: { reasoning_tokens: 20 } } } });
const longText = count => Array.from({ length: count }, (_, index) => `I feel happy about milestone ${index}. ` + `The fictional shelf ${index} has three sections. `.repeat(85)).join('\n\n');
const knownQuota = p => { p.runtime.groqRateLimits = { model: p.settings.model, tokenLimit: 250000, remainingTokens: 250000, remainingRequests: 500000, observedAt: Date.now() }; };
async function run() {
  assert.equal(runtime.parseGroqDuration('2m59.56s'), 179560);
  assert.equal(runtime.parseGroqDuration('7.66s'), 7660);
  assert.equal(runtime.parseGroqDuration('1h2m3.5s'), 3723500);
  assert.equal(runtime.parseGroqDuration('invalid'), 0);
  const snapshot = runtime.groqRateSnapshot({ 'X-RateLimit-Limit-Tokens': '20000', 'X-RateLimit-Remaining-Tokens': '10000',
    'X-RateLimit-Limit-Requests': '500000', 'X-RateLimit-Remaining-Requests': '400000' }, 'fictional', null, 4000, 200, 1000);
  assert.equal(snapshot.remainingTokens, 6000); assert.equal(snapshot.requestLimit, 500000);
  assert.equal(runtime.groqRateDelay(snapshot, 7000, 1000), 3100, 'wait only for the missing tokens, not an entire minute');

  // The compact contract keeps exact quote/direction checks while requiring
  // one whole-chunk acknowledgment instead of repetitive per-passage output.
  const prepared = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text: 'I feel happy and supported.' }]);
  const chunk = prepared.chunks[0];
  const result = compact(chunk);
  const response = reply(result).json;
  let expanded = runtime.expandCompactGroq(response, chunk);
  assert.equal(pipeline.chunkAssessments(expanded, chunk, { reviewed: true }).reviewDimensions.length, 0);
  assert.equal(expanded.insights.passageOutcomes.length, chunk.passages.length);
  assert.throws(() => runtime.expandCompactGroq(reply({ ...result, reviewedAll: false }).json, chunk));
  const fabricated = structuredClone(result); fabricated.evidence[0].quote = 'A fabricated source.';
  expanded = runtime.expandCompactGroq(reply(fabricated).json, chunk);
  assert(pipeline.chunkAssessments(expanded, chunk, { reviewed: true }).reviewDimensions.length > 0);
  const conflict = structuredClone(result); conflict.mood = 1;
  assert(pipeline.chunkAssessments(runtime.expandCompactGroq(reply(conflict).json, chunk), chunk, { reviewed: true }).reviewDimensions.includes('mood'));
  const spaced = structuredClone(result);
  spaced.evidence[0].quote = ` ${spaced.evidence[0].quote} `;
  expanded = runtime.expandCompactGroq(reply(spaced).json, chunk);
  assert.equal(pipeline.chunkAssessments(expanded, chunk, { reviewed: true }).reviewDimensions.length, 0,
    'surrounding quote spaces do not discard a validated anchor during normalization');
  const legacySpaced = pipeline.localChunkAnalysis(chunk);
  legacySpaced.insights.evidence[0].quote = ` ${legacySpaced.insights.evidence[0].quote} `;
  legacySpaced.insights.evidence[0].start--;
  assert.equal(pipeline.chunkAssessments(legacySpaced, chunk, { reviewed: true }).reviewDimensions.length, 0);
  const typography = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text: 'I’m glad\n\tto be here.' }]).chunks[0];
  const repaired = runtime.expandCompactGroq(reply({ mood: 4, energy: null, connection: null, intensity: null,
    reviewedAll: true, ambiguous: [], evidence: [{ dimension: 'mood', passageId: typography.passages[0].id,
      quote: "I'm glad to be here.", score: 4, direction: 'positive', emotion: 'glad', basis: 'personal', temporal: 'present' }] }).json, typography);
  assert.equal(repaired.insights.evidence[0].quote, typography.passages[0].text);
  assert.equal(pipeline.chunkAssessments(repaired, typography, { reviewed: true }).reviewDimensions.length, 0,
    'unique typography and whitespace repair copies the exact source span');
  const repeated = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text: 'I’m glad. I’m glad.' }]).chunks[0];
  const ambiguous = runtime.expandCompactGroq(reply({ mood: 4, energy: null, connection: null, intensity: null,
    reviewedAll: true, ambiguous: [], evidence: [{ dimension: 'mood', passageId: repeated.passages[0].id,
      quote: "I'm glad.", score: 4, direction: 'positive', emotion: 'glad', basis: 'personal', temporal: 'present' }] }).json, repeated);
  assert(pipeline.chunkAssessments(ambiguous, repeated, { reviewed: true }).reviewDimensions.includes('mood'),
    'ambiguous approximate quotations remain unresolved');

  // Known tokens are reserved across concurrent calls. Daily-request headers
  // remain daily quotas and are never interpreted as per-minute throughput.
  let f = setup(); let httpCalls = 0;
  f.p.runtime.groqRateLimits = { model: 'fictional', tokenLimit: 8000, remainingTokens: 8000, observedAt: Date.now() };
  f.p.groqReservations = new Map([[Symbol(), 7000]]);
  respond = async () => { httpCalls++; return reply(result); };
  await assert.rejects(f.p.requestGroq({ model: 'fictional', messages: [], max_completion_tokens: 3000 }), error => error.code === 'quota_wait');
  assert.equal(httpCalls, 0, 'insufficient reserved quota prevents HTTP dispatch');
  f = setup(); f.p.runtime.groqRateLimits = { model: 'fictional', remainingRequests: 0, requestsResetAt: Date.now() + 120000 };
  await assert.rejects(f.p.requestGroq({ model: 'fictional', messages: [] }), error => error.code === 'quota_wait');
  assert.equal(httpCalls, 0);
  f = setup(); knownQuota(f.p); f.p.runtime.groqRateLimits.remainingRequests = 2;
  assert.equal(f.p.groqWorkerLimit(4000), 1, 'daily requests below three cannot start three workers');
  f.p.runtime.groqRateLimits.remainingRequests = 3;
  assert.equal(f.p.groqWorkerLimit(4000), 3);

  f = setup(); httpCalls = 0;
  respond = async () => { httpCalls++; return { status: 429, headers: { 'retry-after': '10' }, json: { error: { code: 'rate_limit_exceeded', message: 'PRIVATE_PROVIDER_TEXT' } } }; };
  await assert.rejects(f.p.requestGroq({ model: 'fictional', messages: [] }), error => error.status === 429 && error.retryAfterMilliseconds >= 9000);
  f.p.clearGroqPause();
  await assert.rejects(f.p.requestGroq({ model: 'fictional', messages: [] }), error => error.code === 'quota_wait');
  assert.equal(httpCalls, 1, 'manual retry cannot bypass a current provider Retry-After');
  assert(!JSON.stringify(f.p.runtime).includes('PRIVATE_PROVIDER_TEXT'));

  for (const content of ['not JSON', JSON.stringify({ insights: {} })]) {
    f = setup(); knownQuota(f.p); httpCalls = 0;
    respond = async () => { httpCalls++; return { status: 200, headers: {}, json: { choices: [{ finish_reason: 'stop', message: { content } }] } }; };
    assert.equal(await f.p.analyzeDate(date), false);
    assert.equal(httpCalls, 2, 'invalid output receives one bounded correction attempt');
    assert.equal(f.p.runtime.pendingDates[date].kind, 'output');
    assert.equal(f.p.groqBlockedUntil, 0, 'a successful HTTP response with invalid analysis does not pause other dates');
    const failed = Object.values(f.p.runtime.chunkWork[date].chunks).find(item => item.state !== 'complete');
    assert(['invalid_json', 'invalid_output'].includes(failed.codes[0].code));
  }

  // Real compact parsing/HTTP adapter with five overlapping independent chunks.
  f = setup(); knownQuota(f.p); f.disk.files.set(f.source.path, longText(7));
  let active = 0, peak = 0, calls = 0, saves = 0;
  const save = f.p.saveData; f.p.saveData = async snapshot => { saves++; return save(snapshot); };
  respond = async payload => {
    calls++; active++; peak = Math.max(peak, active);
    assert.equal(payload.max_completion_tokens, 1536);
    await new Promise(resolve => setTimeout(resolve, 15)); active--;
    return reply(compact(payloadChunk(payload)));
  };
  assert.equal(await f.p.analyzeDate(date), true);
  assert.equal(peak, 5); assert.equal(calls, 7); assert.equal(f.p.records[date].coverage.pendingCharacters, 0);
  assert(f.p.records[date].processing.metrics.sourceCharactersSent <= 60000);
  assert(saves <= calls + 6, 'one durable checkpoint per chunk plus constant date/commit overhead');
  assert.equal(f.p.runtime.groqTelemetry.length, 7);
  assert(f.p.runtime.groqTelemetry.every(row => row.inputTokens === 200 && row.reasoningTokens === 20));

  // Late successful workers cannot clear a concurrent rate-limit pause.
  f = setup(); knownQuota(f.p); f.p.records[date] = priorRecord(); f.disk.files.set(f.source.path, longText(10)); calls = 0;
  respond = async payload => {
    calls++;
    if (calls === 1) return { status: 429, headers: { 'retry-after': '120' }, json: {} };
    await new Promise(resolve => setTimeout(resolve, 20)); return reply(compact(payloadChunk(payload)));
  };
  assert.equal(await f.p.analyzeDate(date, { force: true }), false);
  assert(calls <= 5); assert(f.p.groqBlockedUntil > Date.now() + 110000);
  assert.equal(f.p.runtime.pendingDates[date].kind, 'rate-limit');
  assert.equal(f.p.records[date].summary, 'Fictional old result.');

  // Pending work from the older prompt keeps validated chunks with explicit
  // mixed-prompt provenance rather than silently discarding/relabeling them.
  f = setup(); f.p.settings.maxCharactersPerDay = 200; f.p.settings.minimumCharacters = 1;
  f.disk.files.set(f.source.path, Array.from({ length: 12 }, (_, i) => `I feel hopeful about milestone ${i} and supported by my friends.`).join('\n\n'));
  respond = async payload => reply(compact(payloadChunk(payload)));
  await f.p.analyzeDate(date);
  const gathered = await f.p.gatherDate(date), work = f.p.runtime.chunkWork[date];
  const completedIds = Object.entries(work.chunks).filter(([, value]) => value.state === 'complete').map(([id]) => id);
  assert(completedIds.length > 0);
  work.prompt = 'evidence-context-prompt-v5'; work.promptVersions = [work.prompt]; work.fingerprint = f.p.analysisFingerprint(gathered, 'created-at-local-date', work.prompt);
  const seen = [];
  respond = async payload => { seen.push(payloadChunk(payload).passages[0].id); return reply(compact(payloadChunk(payload))); };
  await f.p.resumePendingAnalysis();
  assert.equal(f.p.records[date].coverage.pendingCharacters, 0);
  assert(f.p.records[date].processing.promptVersions.includes('evidence-context-prompt-v5'));
  for (const id of completedIds) assert(!seen.includes(gathered.prepared.chunks.find(chunk => chunk.id === id).passages[0].id));
  console.log('PASS compact grounding, no redundant review, quota reservations/RPD/Retry-After, five workers, checkpoint cap, global pause retention and completed-chunk migration');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
