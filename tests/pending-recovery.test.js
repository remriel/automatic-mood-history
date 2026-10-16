const assert = require('node:assert/strict');
const pipeline = require('../src/analysis-pipeline');
const { fixture, date, Mood, priorRecord } = require('./reliability-fixture');
const { chunkFromPayload } = require('./provider-fixture');

const longText = Array.from({ length: 5 }, (_, index) =>
  `I feel happy about milestone ${index}. ` + `The fictional shelf ${index} has three sections. `.repeat(85)).join('\n\n');
function preparedFixture() {
  const f = fixture();
  f.disk.files.set(f.source.path, longText);
  f.p.records[date] = priorRecord();
  return f;
}
function failingProvider(p, failedId, calls) {
  p.analyzeWithGroq = async (_date, _text, options) => {
    calls.push(options.chunk.id);
    options.requestBudget.remainingCharacters -= options.chunk.requestCharacters;
    options.metrics.requests++;
    options.metrics.sourceCharactersSent += options.chunk.requestCharacters;
    if (options.chunk.id === failedId) {
      const error = new Error('Synthetic evidence conflict.');
      error.status = 422; error.code = 'semantic_unresolved'; throw error;
    }
    return pipeline.localChunkAnalysis(options.chunk);
  };
}

async function run() {
  // One bad chunk must not prevent assessing independent later source text.
  let f = preparedFixture();
  const prepared = (await f.p.gatherDate(date)).prepared;
  assert(prepared.chunks.length >= 4);
  const failedId = prepared.chunks[0].id;
  let calls = [];
  failingProvider(f.p, failedId, calls);
  assert.equal(await f.p.analyzeDate(date, { force: true }), false);
  assert.equal(calls.length, prepared.chunks.length, 'one unresolved chunk does not block the rest of the date');
  assert.equal(f.p.runtime.analysisStates[date].coverage.processedChunks, prepared.chunks.length - 1);
  assert.equal(f.p.records[date].summary, 'Fictional old result.');
  assert.equal(f.p.runtime.pendingDates[date].kind, 'output', 'a semantic failure is not reported as a budget pause');

  // Reload reuses every validated chunk and explicit pending recovery retries
  // only unfinished work; old unrelated history is never force-reanalyzed.
  let restart = fixture(f.disk);
  await restart.p.onload();
  restart.p.records['2030-01-01'] = { ...priorRecord(), date: '2030-01-01' };
  calls = [];
  restart.p.analyzeWithGroq = async (_date, _text, options) => {
    calls.push(options.chunk.id); return pipeline.localChunkAnalysis(options.chunk);
  };
  await restart.p.resumePendingAnalysis();
  assert.deepEqual(calls, [failedId]);
  assert.equal(restart.p.records[date].coverage.pendingCharacters, 0);
  assert.equal(restart.p.records['2030-01-01'].summary, 'Fictional old result.');
  assert.equal(restart.p.runtime.chunkWork[date], undefined);

  // A queued pending-only command must recheck after another queued task
  // commits the same date, rather than force-refreshing that completed result.
  const beforeCalls = calls.length;
  await restart.p.analyzeDate(date, { onlyPending: true, force: true });
  assert.equal(calls.length, beforeCalls);

  // A cooling chunk is skipped without hiding eligible work after it.
  f = preparedFixture(); calls = [];
  failingProvider(f.p, failedId, calls);
  await f.p.analyzeDate(date, { force: true });
  const laterId = prepared.chunks.at(-1).id;
  delete f.p.runtime.chunkWork[date].chunks[laterId];
  calls.length = 0;
  await f.p.analyzeDate(date);
  assert.deepEqual(calls, [laterId], 'per-chunk cooldown does not block a later ready chunk');
  assert.equal(f.p.runtime.pendingDates[date].retryAt, f.p.runtime.chunkWork[date].chunks[failedId].retryAt);

  // A failed checkpoint after successful analysis is a storage retry. It must
  // not create a provider cooldown or resend the successfully validated chunk.
  f = preparedFixture(); calls = []; let failCheckpoint = true;
  failingProvider(f.p, 'never-fails', calls);
  const save = f.p.saveData;
  f.p.saveData = async snapshot => {
    if (failCheckpoint && Object.values(snapshot.runtime.chunkWork?.[date]?.chunks || {}).some(chunk => chunk.state === 'complete')) {
      failCheckpoint = false; throw new Error('Synthetic checkpoint storage failure.');
    }
    return save(snapshot);
  };
  await f.p.analyzeDate(date, { force: true });
  assert.equal(f.p.runtime.pendingDates[date].kind, 'storage');
  assert.equal(f.p.groqBlockedUntil, 0);
  const savedFirst = calls[0]; calls.length = 0;
  await f.p.resumePendingAnalysis();
  assert(!calls.includes(savedFirst));
  assert.equal(f.p.records[date].coverage.pendingCharacters, 0);

  // The character cap controls each pass. Making progress does not build an
  // exponential failure penalty, and reload keeps successful chunks reusable.
  f = fixture(); f.p.settings.maxCharactersPerDay = 200; f.p.settings.minimumCharacters = 1;
  f.disk.files.set(f.source.path, Array.from({ length: 18 }, (_, index) =>
    `I feel hopeful about milestone ${index}, and I feel supported by my friends.`).join('\n\n'));
  let p = f.p;
  for (let pass = 0; pass < 5; pass++) {
    p.analyzeWithGroq = async (_date, _text, options) => {
      options.requestBudget.remainingCharacters -= options.chunk.requestCharacters;
      return pipeline.localChunkAnalysis(options.chunk);
    };
    const before = Date.now();
    await p.analyzeDate(date, { force: true });
    assert.equal(p.runtime.pendingDates[date].kind, 'budget');
    assert.equal(p.runtime.pendingDates[date].attempts, 1, 'budget continuations are not repeated failures');
    assert(Date.parse(p.runtime.pendingDates[date].retryAt) - before < 65000);
    restart = fixture(f.disk); p = restart.p; await p.onload();
  }

  // Provider-wide failures still stop dispatch immediately, and cancellation
  // cannot turn into a recoverable chunk failure or send later source text.
  for (const failure of [Object.assign(new Error('Synthetic rate limit.'), { status: 429, retryAfterMilliseconds: 120000 }),
    Object.assign(new Error('Cancelled.'), { code: 'analysis_cancelled' })]) {
    f = preparedFixture(); calls = [];
    f.p.analyzeWithGroq = async (_date, _text, options) => { calls.push(options.chunk.id); throw failure; };
    await f.p.analyzeDate(date, { force: true });
    assert.equal(calls.length, 1);
    assert.equal(f.p.records[date].summary, 'Fictional old result.');
    if (failure.status === 429) assert(Date.parse(f.p.runtime.pendingDates[date].retryAt) >= f.p.groqBlockedUntil);
    if (failure.status === 429) assert.equal(f.p.runtime.pendingDates[date].attempts, 1, 'one global failure is counted once');
  }

  // A full 68-chunk synthetic date exercises the real request/validation path,
  // automatic recovery and disk reload. One poisoned response stays pending
  // while the other 67 chunks finish within the saved cap on every pass.
  f = preparedFixture(); f.p.settings.autoAnalyze = true;
  f.disk.files.set(f.source.path, Array.from({ length: 68 }, (_, index) =>
    `I feel happy about milestone ${index}. ` + `The fictional shelf ${index} has three sections. `.repeat(85)).join('\n\n'));
  const large = (await f.p.gatherDate(date)).prepared;
  assert.equal(large.chunks.length, 68);
  const poisonedPassage = large.chunks[0].passages[0].id;
  p = f.p; const seen = new Map(); let corrected = false;
  const wire = plugin => {
    plugin.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
    plugin.requestGroq = async payload => {
      const chunk = chunkFromPayload(payload); chunk.text = chunk.passages.map(item => item.text).join('\n\n');
      const id = chunk.passages[0].id; seen.set(id, (seen.get(id) || 0) + 1);
      const output = pipeline.localChunkAnalysis(chunk);
      if (id === poisonedPassage && !corrected) output.moodScore = 1;
      return { choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(output) } }] };
    };
  };
  for (let pass = 0; pass < 8; pass++) {
    wire(p);
    const before = p.runtime.chunkWork?.[date]?.metrics.sourceCharactersSent || 0;
    if (p.runtime.pendingDates?.[date]) p.runtime.pendingDates[date].retryAt = new Date(0).toISOString();
    p.lastAutomaticReconcileAt = Date.now();
    if (pass === 0) await p.analyzeDate(date, { force: true }); else await p.runAutomaticRecovery();
    const work = p.runtime.chunkWork[date];
    assert(work.metrics.sourceCharactersSent - before <= 60000);
    assert.equal(p.records[date].summary, 'Fictional old result.');
    if (p.runtime.analysisStates[date].coverage.processedChunks === 67) break;
    restart = fixture(f.disk); p = restart.p; await p.onload();
  }
  assert.equal(p.runtime.analysisStates[date].coverage.processedChunks, 67);
  assert.equal(seen.get(poisonedPassage), 2, 'a cooling failure is not repeatedly submitted while later chunks progress');
  for (const chunk of large.chunks.slice(1)) assert.equal(seen.get(chunk.passages[0].id), 1);
  corrected = true; wire(p);
  p.runtime.pendingDates[date].retryAt = new Date(0).toISOString();
  p.runtime.chunkWork[date].chunks[large.chunks[0].id].retryAt = new Date(0).toISOString();
  p.lastAutomaticReconcileAt = Date.now();
  await p.runAutomaticRecovery();
  assert.equal(p.records[date].coverage.processedChunks, 68);
  assert.equal(p.records[date].coverage.pendingCharacters, 0);
  assert.equal(p.runtime.chunkWork[date], undefined);
  assert.equal(seen.get(poisonedPassage), 3, 'the pending dimension needs one targeted request after correction');
  console.log('PASS isolated chunk failures, pending-only resume, cooldown fairness, stable budget continuation, reload reuse and provider-wide/cancellation stops');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
