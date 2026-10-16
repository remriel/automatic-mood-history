// Synthetic engineering evaluation. Never reads vaults or writes raw responses.
const fs = require('node:fs');
const crypto = require('node:crypto');
const vm = require('node:vm');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const { Mood } = require('../tests/reliability-fixture');
const pipeline = require('../src/analysis-pipeline');
const argv = process.argv.slice(2);
const option = (name, fallback) => argv.find(item => item.startsWith(`--${name}=`))?.split('=').slice(1).join('=') || fallback;
const live = argv.includes('--live');
const development = argv.includes('--development');
const repeats = Number(option('repeats', '3'));
const model = option('model', 'openai/gpt-oss-120b');
const corpus = require(`../tests/fixtures/coverage-${development ? 'development' : 'evaluation'}.json`);
const selectedCases = option('cases', '').split(',').filter(Boolean);
if (selectedCases.length) corpus.cases = corpus.cases.filter(item => selectedCases.includes(item.id));
const reusedBaseline = option('reuse-baseline', '') ? JSON.parse(fs.readFileSync(option('reuse-baseline', ''), 'utf8')) : null;
const evaluatedImplementationHash = crypto.createHash('sha256').update(fs.readFileSync('src/analysis-pipeline.js')).update(fs.readFileSync('src/emotional-engine.js')).update(fs.readFileSync('src/sentiment-core.js')).update(fs.readFileSync('src/main.js','utf8').split('  groqPrompt(')[1].split('  async analyzeDate(')[0]).digest('hex');
const baselineCode = execFileSync('git', ['show', '6f17fcc8c509428e4ed71c29540896909cbcfd53:main.js'], { encoding: 'utf8', maxBuffer: 2000000 });
const sandbox = { module: { exports: {} }, require: name => { if (name !== 'obsidian') throw new Error('Unexpected baseline dependency'); return { Plugin: class {}, PluginSettingTab: class {}, Component: class {}, Notice: class {}, TFile: class {}, TFolder: class {} }; }, TextEncoder, Date, process, console, setTimeout };
vm.runInNewContext(baselineCode, sandbox);
const Baseline = sandbox.module.exports;
const baselineCore = execFileSync('git', ['show', '6f17fcc8c509428e4ed71c29540896909cbcfd53:src/emotional-engine.js'], { encoding: 'utf8' });
const localSandbox = { module: { exports: {} } }; vm.runInNewContext(baselineCore, localSandbox);
const oldLocal = localSandbox.module.exports.contextualAnalysis;

async function remote(Plugin, text, current, metrics) {
  const plugin = new Plugin();
  plugin.settings = { enableGroq: true, model, minimumCharacters: 1, maxCharactersPerDay: 60000 };
  plugin.runtime = {}; plugin.groqBlockedUntil = 0;
  plugin.apiKey = () => process.env.GROQ_API_KEY;
  plugin.requestGroq = async payload => {
    metrics.requests++;
    const started = performance.now();
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', { method: 'POST',
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(120000) });
    metrics.providerMilliseconds += performance.now() - started;
    const body = await response.json().catch(() => null);
    if (!response.ok) { const error = new Error(`Provider HTTP ${response.status}`); error.status = response.status;
      error.retryAfterMilliseconds = Number(response.headers.get('retry-after')) * 1000; throw error; }
    metrics.inputTokens += body?.usage?.prompt_tokens || 0; metrics.outputTokens += body?.usage?.completion_tokens || 0;
    return body;
  };
  if (!current) return plugin.analyzeWithGroq('2031-02-03', text);
  const prepared = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text }]);
  const analyses = [];
  const budget = { remainingCharacters: 60000 };
  for (const chunk of prepared.chunks) {
    let stagedAnalysis;
    for (let cycle = 0; cycle < 3; cycle++) {
      if (budget.remainingCharacters < chunk.requestCharacters) budget.remainingCharacters = 60000;
      try { const analysis = await plugin.analyzeWithGroq('2031-02-03', chunk.text, { chunk, requestBudget: budget, stagedAnalysis }); analyses.push({ chunk, analysis }); break; }
      catch (error) {
        if (cycle >= 2 || !error.stagedAnalysis || !['semantic_unresolved', 'processing_budget'].includes(error.code)) throw error;
        metrics.initialUnresolved = true; metrics.recoveryCycles = (metrics.recoveryCycles || 0) + 1;
        stagedAnalysis = error.stagedAnalysis;
        budget.remainingCharacters = 60000;
      }
    }
  }
  return pipeline.aggregateChunkAnalyses(analyses);
}

async function run() {
  if (live && !process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY is unavailable');
  const results = reusedBaseline ? reusedBaseline.results.filter(item => item.engine === '1.3.2') : [];
  for (let repeat = 0; repeat < (live ? repeats : 1); repeat++) for (const entry of corpus.cases) for (const current of (reusedBaseline ? [true] : [false, true])) {
    const metrics = { requests: 0, inputTokens: 0, outputTokens: 0, providerMilliseconds: 0 };
    const started = performance.now(); let result; let errorCode = null;
    try {
      result = live ? await remote(current ? Mood : Baseline, entry.text, current, metrics) : current ? (() => {
        const prepared = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text: entry.text }]);
        return pipeline.aggregateChunkAnalyses(prepared.chunks.map(chunk => ({ chunk, analysis: pipeline.localChunkAnalysis(chunk) })));
      })() : oldLocal(entry.text);
    } catch (error) { if (development) console.log(JSON.stringify({safeError: error.message, codes: error.stagedAnalysis?.validation, states: error.stagedAnalysis?.insights?.assessments})); errorCode = error.code ? error.code : error.status ? `status_${error.status}` : ['semantic_unresolved', 'processing_budget', 'empty_evidence'].includes(error.code) ? error.code : 'invalid_output'; }
    const checks = Object.fromEntries(Object.entries(entry.required).map(([axis, range]) => [axis, Number.isFinite(result?.[`${axis}Score`]) && result[`${axis}Score`] >= range[0] && result[`${axis}Score`] <= range[1]]));
    const unsupported = entry.unsupported.filter(axis => Number.isFinite(result?.[`${axis}Score`]));
    results.push({ id: entry.id, repeat, engine: current ? 'current' : '1.3.2', success: Boolean(result), checks, unsupported, errorCode,
      milliseconds: +(performance.now() - started).toFixed(2), ...metrics });
    console.log(`${live ? 'live' : 'local'} ${repeat + 1}/${live ? repeats : 1} ${entry.id} ${current ? 'current' : '1.3.2'} ${result ? 'assessed' : errorCode} ${metrics.requests} requests`);
  }
  const summary = {};
  for (const engine of ['1.3.2', 'current']) {
    const selected = results.filter(item => item.engine === engine);
    const recall = axis => { const cases = selected.filter(item => Object.hasOwn(item.checks, axis)); return { passed: cases.filter(item => item.checks[axis]).length, total: cases.length }; };
    summary[engine] = { moodRecall: recall('mood'), connectionRecall: recall('connection'), requiredConstraintsPassed: selected.reduce((sum, item) => sum + Object.values(item.checks).filter(Boolean).length, 0),
      requiredConstraints: selected.reduce((sum, item) => sum + Object.keys(item.checks).length, 0), unsupportedInferences: selected.reduce((sum, item) => sum + item.unsupported.length, 0),
      unsupportedOpportunities: corpus.cases.reduce((sum, item) => sum + item.unsupported.length, 0) * (live ? repeats : 1),
      unresolvedCases: selected.filter(item => !item.success).length, initialUnresolvedCases: selected.filter(item => item.initialUnresolved || !item.success).length, recoveryCycles: selected.reduce((sum,item)=>sum+(item.recoveryCycles||0),0),
      requests: selected.reduce((sum, item) => sum + item.requests, 0), inputTokens: selected.reduce((sum, item) => sum + item.inputTokens, 0), outputTokens: selected.reduce((sum, item) => sum + item.outputTokens, 0),
      medianMilliseconds: selected.map(item => item.milliseconds).sort((a,b)=>a-b)[Math.floor(selected.length/2)] };
  }
  const implementationHash = evaluatedImplementationHash;
  const report = { version: 1, implementationHash, reusedBaselineReport: reusedBaseline ? option('reuse-baseline', '') : null, baseline: '6f17fcc8c509428e4ed71c29540896909cbcfd53', corpus: development ? 'development' : 'frozen', live, model: live ? model : 'local', repeats: live ? repeats : 1,
    note: 'Synthetic engineering labels; no clinical accuracy claim. At most two later recovery cycles resume valid staged work only after unresolved validation/budget errors. Completed incorrect scores are never retried for a more favorable result. Recovery is accelerated without waiting for the production cooldown. Initial unresolved cases and recovery cost are reported separately.', summary, results };
  fs.writeFileSync(option('output', `docs/COVERAGE_${live ? 'LIVE' : 'LOCAL'}_EVALUATION.json`), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify(summary, null, 2));
}
run().catch(error => { console.error(error.message); process.exitCode = 1; });
