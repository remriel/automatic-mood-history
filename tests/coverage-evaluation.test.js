const assert = require('node:assert/strict');
const { groqContractHash } = require('../scripts/groq-contract-hash');
const corpus = require('./fixtures/coverage-evaluation.json');
const report = require('../docs/GROQ_VALIDATION_1.5.1.json');
const prior = require('../docs/GROQ_FAST_ACCURACY.json');
const performance = require('../docs/GROQ_PERFORMANCE.json');
assert.equal(report.corpus, 'regression');
assert.equal(report.model, 'openai/gpt-oss-120b');
assert(report.repeats >= 3);
assert.equal(report.results.length, corpus.cases.length * report.repeats);
const hash = groqContractHash();
assert.equal(report.analysisContractHash, hash, 'provider/engine/runtime changes require refreshed acceptance evidence');
assert.equal(performance.analysisContractHash, prior.analysisContractHash, 'preserve the original 1.5.0 measurement provenance');
assert.equal(report.summary.current.successful, report.results.length);
assert.equal(report.summary.current.unsupported, 0);
assert(report.results.every(row => row.success && row.rateLimits === 0 && row.requests <= 2));
// Live model abstentions vary between repeats. Require a majority pass for
// every frozen score constraint and retain every miss in the published report.
for (const row of corpus.cases) for (const axis of Object.keys(row.required)) {
  const attempts = report.results.filter(result => result.id === row.id);
  assert(attempts.filter(result => result.checks[axis]).length >= 2, `${row.id}:${axis} failed a majority of live repeats`);
}
const old = report.workers.find(row => row.engine === '1.4.1'), fast = report.workers.find(row => row.engine === 'current');
assert(old.success && fast.success);
assert.equal(old.chunks, fast.chunks);
assert(fast.milliseconds <= old.milliseconds * 0.2, 'recorded batch benchmark must meet the requested approximate 80% speed target');
assert(fast.peakConcurrency <= 5 && fast.rateLimits === 0);
console.log(`PASS exact analysis-runtime ${report.results.length}-evaluation/${report.summary.current.passed}-of-${report.summary.current.constraints}-score regression, zero unsupported scores, two-call cap and measured >80% batch speed acceptance`);
