const assert = require('node:assert/strict');
const pipeline = require('../src/analysis-pipeline');
const { fixture, date, Mood, priorRecord, clone } = require('./reliability-fixture');
const { version2, chunkFromPayload } = require('./provider-fixture');
const reply = analysis => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(analysis) } }] });
const prepare = (text, budget = 60000) => pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text }], budget);
const full = text => {
  const chunk = prepare(text).chunks[0];
  return { chunk, analysis: pipeline.localChunkAnalysis(chunk) };
};
function wireProvider(p, change = analysis => analysis) {
  p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  let calls = 0;
  p.requestGroq = async payload => {
    calls++;
    const chunk = chunkFromPayload(payload);
    chunk.text = chunk.passages.map(item => item.text).join('\n\n');
    return reply(change(pipeline.localChunkAnalysis(chunk), calls, payload));
  };
  return () => calls;
}

async function run() {
  const raw = ['---', 'secret: frontmatter', '---', '', '# Heading', '', '> I feel understood.', '',
    '```js', 'I feel angry in excluded code.', '', 'still code', '```', '',
    '~~~python', 'I feel lonely in excluded code.', '~~~', '',
    '```mermaid', 'mindmap', ' root', '   I feel hopeful', '```', '',
    'I feel exhausted.', '', 'I feel exhausted.'].join('\n');
  const source = prepare(raw, 100);
  assert(source.analysisText.includes('understood'));
  assert(source.analysisText.includes('hopeful'));
  for (const excluded of ['frontmatter', 'Heading', 'excluded code', 'still code']) assert(!source.analysisText.includes(excluded), excluded);
  assert(source.accounting.excludedBlocks > 0); assert(source.accounting.duplicateCharacters > 0);
  assert(source.sourceMap.every(item => Number.isInteger(item.rawStart) && item.rawEnd >= item.rawStart));
  for (const code of ['````js\nI feel sad.\n\nmore excluded code\n````', '```js\nI feel lonely.\n\nmore excluded code', '~~~python\nI feel sad.\n\nmore excluded code']) {
    assert.equal(prepare(code).analysisText, '', 'long or unclosed code fences never become eligible prose');
  }
  const unbroken = '🧭'.repeat(301);
  const split = prepare(unbroken, 100);
  assert.equal(split.passages.map(item => item.text).join(''), unbroken);
  assert(split.passages.every(item => item.text.length <= 50));
  assert.equal(split.accounting.eligibleCharacters, unbroken.length);
  assert.deepEqual(split.chunks.map(item => item.id), prepare(unbroken, 100).chunks.map(item => item.id));
  const envelope = pipeline.providerEnvelope(source.chunks[0]);
  assert(!envelope.includes('Synthetic.md'));
  assert(!envelope.includes('rawStart'));

  // Wrong passage identity, fabricated text and repeated-quote ambiguity never
  // become accepted evidence; unique exact quotations can repair offsets.
  const text = 'I feel happy and supported. I feel happy again.';
  const { chunk, analysis } = full(text);
  const valid = pipeline.chunkAssessments(analysis, chunk, { reviewed: true });
  assert(valid.insights.evidence.length);
  const charge = full('These accusations turn every independent choice into betrayal.');
  const chargeQuote = charge.chunk.text;
  charge.analysis.intensityScore = 4;
  charge.analysis.insights.evidence = [{ dimension: 'intensity', basis: 'textual', quote: chargeQuote, passageId: charge.chunk.passages[0].id,
    start: 0, score: 4, direction: 'negative', emotion: 'narcissistic disorder', confidence: 'medium', meaning: 'inferred', temporal: 'unspecified', support: 'medium' }];
  charge.analysis.insights.assessments.intensity = { state: 'supported', reason: 'evidence' };
  const downgraded = pipeline.chunkAssessments(charge.analysis, charge.chunk, { reviewed: true });
  assert.equal(downgraded.intensityScore, 4);
  assert.equal(downgraded.insights.evidence[0].emotion, '');
  assert(downgraded.validation.some(item => item.code === 'diagnostic_label_removed'));
  assert(!JSON.stringify(downgraded).includes('narcissistic disorder'));
  const omittedPassage = clone(analysis); omittedPassage.insights.passageOutcomes = [];
  const noCoverage = pipeline.chunkAssessments(omittedPassage, chunk, { reviewed: true });
  assert.equal(noCoverage.reviewDimensions.length, 4, 'nonempty evidence does not acknowledge every eligible passage');
  assert(noCoverage.validation.some(item => item.code === 'missing_passage'));
  for (const mutation of [item => ({ ...item, passageId: 'wrong' }), item => ({ ...item, quote: 'fabricated quote' })]) {
    const bad = clone(analysis); bad.insights.evidence = bad.insights.evidence.map(mutation);
    const checked = pipeline.chunkAssessments(bad, chunk, { reviewed: true });
    assert.equal(checked.insights.evidence.length, 0);
    assert(checked.reviewDimensions.length); assert(checked.validation.some(item => ['unknown_passage', 'quote_not_in_passage'].includes(item.code)));
  }
  const repeatChunk = prepare('I feel happy. I feel happy.').chunks[0];
  const repeated = full('I feel happy.').analysis;
  repeated.insights.evidence = repeated.insights.evidence.map(item => ({ ...item, quote: 'I feel happy.', start: 999 }));
  assert.equal(pipeline.chunkAssessments(repeated, repeatChunk, { reviewed: true }).insights.evidence.length, 0);

  // An intensity-only primary response still requests mood and connection review.
  let f = fixture(); f.disk.files.set(f.source.path, 'I feel sad and lonely after trying to reach my friends.');
  const calls = wireProvider(f.p, (analysis, count) => {
    if (count === 1) for (const axis of ['mood', 'connection']) {
      analysis[`${axis}Score`] = null; analysis.insights.assessments[axis] = { state: 'not_assessed', reason: 'unreviewed' };
      analysis.insights.evidence = analysis.insights.evidence.filter(item => item.dimension !== axis);
    }
    return analysis;
  });
  assert.equal(await f.p.analyzeDate(date), true); assert.equal(calls(), 2);
  assert(f.p.records[date].moodScore <= 3); assert(f.p.records[date].connectionScore <= 3);
  assert.equal(f.p.records[date].processing.state, 'complete');

  // Explicit abstention completes in one call even if an English cue disagrees.
  f = fixture(); f.disk.files.set(f.source.path, 'I feel sad is an example sentence in this language exercise.');
  const abstentionCalls = wireProvider(f.p, analysis => {
    for (const axis of pipeline.DIMENSIONS) { analysis[`${axis}Score`] = null; analysis.insights.assessments[axis] = { state: 'unsupported', reason: 'no_support' }; }
    analysis.insights.evidence = []; return analysis;
  });
  assert.equal(await f.p.analyzeDate(date), true); assert.equal(abstentionCalls(), 1);
  assert.equal(f.p.records[date].status, 'insufficient');
  assert.equal(f.p.records[date].processing.state, 'complete');
  assert.equal(f.p.records[date].insights.assessments.mood.state, 'unsupported');

  // A score conflict leaves valid energy staged and the previous result visible.
  f = fixture(); const old = priorRecord(); f.p.records[date] = old;
  f.disk.files.set(f.source.path, 'I feel happy but exhausted after the long workday.');
  const conflictCalls = wireProvider(f.p, analysis => { analysis.moodScore = 1; return analysis; });
  assert.equal(await f.p.analyzeDate(date, { force: true }), false); assert.equal(conflictCalls(), 2);
  assert.equal(f.p.records[date], old);
  const pendingChunk = Object.values(f.p.runtime.chunkWork[date].chunks)[0];
  assert.equal(pendingChunk.analysis.insights.assessments.mood.state, 'conflict');
  assert.equal(pendingChunk.analysis.insights.assessments.energy.state, 'supported');
  assert.equal(pendingChunk.analysis.energyScore, 1);
  assert.equal(f.p.runtime.analysisStates[date].state, 'partially_assessed');
  const resumed = fixture(f.disk).p; await resumed.onload();
  const resumedCalls = wireProvider(resumed);
  assert.equal(await resumed.analyzeDate(date, { force: true }), true);
  assert.equal(resumedCalls(), 1, 'valid staged dimensions resume with one targeted review');
  const fallback = fixture(); fallback.disk.files.set(fallback.source.path, 'I feel sad and lonely after trying to reach my friends.');
  fallback.p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  let fallbackCalls = 0;
  fallback.p.requestGroq = async payload => {
    fallbackCalls++;
    if (fallbackCalls === 2) throw Object.assign(new Error('Structured generation failed.'), { status: 400, code: 'json_validate_failed' });
    const currentChunk = chunkFromPayload(payload); currentChunk.text = currentChunk.passages.map(item => item.text).join('\n\n');
    const output = pipeline.localChunkAnalysis(currentChunk);
    if (fallbackCalls === 1) { output.moodScore = 5; }
    return reply(output);
  };
  assert.equal(await fallback.p.analyzeDate(date), false);
  assert.equal(fallbackCalls, 2, 'a chunk spends at most two calls; valid staged axes survive a failed repair');
  assert.equal(await fallback.p.analyzeDate(date, { force: true }), true);
  assert.equal(fallbackCalls, 3, 'a later explicit resume uses one correction rather than restarting validated work');
  assert(fallback.p.records[date].moodScore <= 3);

  // Per-run source budget includes repeated attempts; reload reuses complete
  // chunks under the identical fingerprint, never a prefix-complete record.
  f = fixture(); f.p.settings.maxCharactersPerDay = 200; f.p.settings.minimumCharacters = 1;
  f.p.records[date] = priorRecord();
  const long = Array.from({ length: 18 }, (_, i) => `I feel hopeful about milestone ${i}, and I feel supported by my friends.`).join('\n\n');
  f.disk.files.set(f.source.path, long);
  let p = f.p; let providerCalls = wireProvider(p); let totalCalls = 0;
  assert.equal(await p.analyzeDate(date, { force: true }), false);
  totalCalls += providerCalls();
  assert.equal(p.records[date].summary, 'Fictional old result.');
  assert(p.runtime.analysisStates[date].coverage.pendingCharacters > 0);
  const completed = Object.values(p.runtime.chunkWork[date].chunks).filter(item => item.state === 'complete').length;
  assert(completed > 0);
  for (let iteration = 0; iteration < 30 && p.runtime.chunkWork?.[date]; iteration++) {
    const restart = fixture(f.disk); p = restart.p; await p.onload();
    providerCalls = wireProvider(p);
    const before = p.runtime.chunkWork[date].metrics.sourceCharactersSent;
    await p.analyzeDate(date, { force: true }); totalCalls += providerCalls();
    const after = p.runtime.chunkWork?.[date]?.metrics.sourceCharactersSent ?? p.records[date].processing.metrics.sourceCharactersSent;
    assert(after - before <= 200, 'saved remote data budget is never increased');
  }
  assert.equal(p.records[date].coverage.pendingCharacters, 0);
  assert.equal(p.records[date].coverage.processedChunks, p.records[date].coverage.totalChunks);
  assert.equal(totalCalls, p.records[date].coverage.totalChunks, 'successful chunks are reused after reload');
  assert(p.records[date].processing.metrics.requests > 1);
  assert(p.records[date].coverage.mappings.length > 0, 'source mappings survive final commit');

  // Mixed completion recovery, malformed format fallback and semantic review
  // cannot exceed the compact two-attempt allowance.
  f = fixture(); f.p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  const budgetChunk = prepare('I feel sad and lonely after reaching out.').chunks[0];
  let attempts = 0;
  f.p.requestGroq = async () => {
    attempts++;
    if (attempts === 1) return { choices: [{ finish_reason: 'length' }] };
    if (attempts <= 3) return { choices: [{ message: { content: '{malformed' } }] };
    const output = pipeline.localChunkAnalysis(budgetChunk);
    output.moodScore = 5; return reply(output);
  };
  await assert.rejects(f.p.analyzeWithGroq(date, budgetChunk.text, { chunk: budgetChunk }));
  assert(attempts <= 2);

  // A newly eligible source invalidates in-flight work even with automatic
  // analysis disabled. Event invalidation does not itself schedule remote work.
  f = fixture(); f.p.settings.autoAnalyze = false;
  const guard = f.p.analysisGuard();
  f.p.handleSourceEvent(new (require('./reliability-fixture').TFile)('Journal/New.md'));
  assert.throws(guard, error => error.code === 'analysis_cancelled');
  assert.equal(f.p.providerCalls, 0);
  const legacy = fixture(); legacy.p.records[date] = priorRecord();
  await legacy.p.analyzeDate(date);
  assert.equal(legacy.p.providerCalls, 0, 'unknown legacy hashes never authorize historical remote submission');
  assert.equal(legacy.p.runtime.analysisStates[date].state, 'stale');

  // A provider/cloud read that never settles becomes an explicit source retry.
  const unavailable = fixture(); unavailable.p.app.vault.cachedRead = () => new Promise(() => {});
  const originalTimeout = globalThis.setTimeout;
  globalThis.setTimeout = (callback, milliseconds, ...args) => originalTimeout(callback, milliseconds === 15000 ? 1 : milliseconds, ...args);
  try { await assert.rejects(unavailable.p.gatherDate(date), error => error.code === 'source_read'); }
  finally { globalThis.setTimeout = originalTimeout; }

  // Display-only repair performs local inspection and zero provider requests.
  f = fixture(); f.p.settings.enableGroq = false;
  f.disk.files.set(f.source.path, 'I feel exhausted after the workday and have nothing left to give.');
  await f.p.analyzeDate(date); assert.equal(f.p.records[date].moodScore, null);
  f.p.repairPreview = await f.p.buildRepairPreview();
  assert(f.p.repairPreview.entries[0].displayOnly);
  assert.equal(f.p.repairPreview.entries[0].requests, 0);
  await f.p.repairSelected([date]); assert.equal(f.p.providerCalls, 0);

  // Duplication, neutral padding, paragraph order and safe chunk boundaries do
  // not give artificial extra votes to a feeling or discard opposing support.
  const paragraphs = ['I feel happy about the new opportunity.', 'I feel sad about leaving the old place.', 'I feel supported by my friends.', 'I feel exhausted after work.'];
  const calculate = (text, budget) => { const prepared = prepare(text, budget); return pipeline.aggregateChunkAnalyses(prepared.chunks.map(chunk => ({ chunk, analysis: pipeline.localChunkAnalysis(chunk) }))); };
  const original = calculate(paragraphs.join('\n\n'), 60000);
  for (const result of [calculate([...paragraphs].reverse().join('\n\n'), 60000), calculate([...paragraphs, ...paragraphs].join('\n\n'), 60000),
    calculate(paragraphs.join('\n\n') + '\n\nThe cupboard has three shelves.', 60000), calculate(paragraphs.join('\n\n'), 200)]) {
    for (const axis of pipeline.DIMENSIONS) assert.equal(result[`${axis}Score`], original[`${axis}Score`], axis);
    assert(result.insights.support.mood.positive > 0 && result.insights.support.mood.negative > 0);
  }
  const many = Array.from({ length: 40 }, (_, i) => ({ ...original.insights.evidence[0], quote: `quote ${i}`, dimension: 'intensity', direction: 'neutral' }));
  const balanced = pipeline.selectEvidenceForDisplay([...many, ...original.insights.evidence]);
  for (const axis of ['mood', 'connection', 'energy']) assert(balanced.some(item => item.dimension === axis));
  assert(balanced.length <= 16);
  console.log('PASS complete preparation/mappings/exclusions, opaque envelopes, provenance, dimension review/abstention/conflicts, durable budget/reload reuse, display-only repair and aggregation invariants');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
