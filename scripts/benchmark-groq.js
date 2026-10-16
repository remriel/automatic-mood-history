// Reproducible synthetic provider/worker benchmark. Never reads a private vault.
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { performance } = require('node:perf_hooks');
const pipeline = require('../src/analysis-pipeline');
const { groqContractHash } = require('./groq-contract-hash');
const args = process.argv.slice(2);
const option = (name, fallback) => args.find(value => value.startsWith(`--${name}=`))?.slice(name.length + 3) || fallback;
const development = args.includes('--development');
const corpus = require(`../tests/fixtures/coverage-${development ? 'development' : 'evaluation'}.json`);
const selected = option('cases', '').split(',').filter(Boolean);
const cases = selected.length ? corpus.cases.filter(row => selected.includes(row.id)) : corpus.cases;
const repeats = Number(option('repeats', '1'));
const baselineCode = execFileSync('git', ['show', '1.4.1:main.js'], { encoding: 'utf8', maxBuffer: 2000000 });
const currentCode = fs.readFileSync('main.js', 'utf8');
const measuredContractHash = groqContractHash();
const measuredImplementationHash = crypto.createHash('sha256').update(fs.readFileSync('src/analysis-pipeline.js')).update(fs.readFileSync('src/emotional-engine.js'))
  .update(fs.readFileSync('src/sentiment-core.js')).update(fs.readFileSync('src/groq-runtime.js')).update(fs.readFileSync('src/main.js')).digest('hex');
const report = { version: 1, corpus: development ? 'development' : 'frozen', baseline: '1.4.1', model: 'openai/gpt-oss-120b', repeats,
  note: 'Synthetic engineering accuracy checks and real provider latency. No private vault or clinical accuracy claim. Baseline/current use identical input. Worker comparison excludes native disk/DOM overhead.',
  results: [] };
function loadPlugin(code, metrics) {
  const sandbox = { module: { exports: {} }, TextEncoder, Date, process, console, setTimeout, clearTimeout, Symbol,
    require: name => {
      if (name !== 'obsidian') throw new Error('Unexpected dependency.');
      return { Plugin: class {}, PluginSettingTab: class {}, Component: class {}, TFile: class {}, TFolder: class {}, Notice: class {},
        requestUrl: async request => {
          const started = performance.now(); metrics.requests++;
          const response = await fetch(request.url, { method: request.method, headers: request.headers, body: request.body, signal: AbortSignal.timeout(120000) });
          metrics.providerMilliseconds += performance.now() - started;
          const json = await response.json().catch(() => null);
          metrics.inputTokens += json?.usage?.prompt_tokens || 0; metrics.outputTokens += json?.usage?.completion_tokens || 0;
          metrics.reasoningTokens += json?.usage?.completion_tokens_details?.reasoning_tokens || 0;
          if (response.status === 429) metrics.rateLimits++;
          return { status: response.status, headers: Object.fromEntries(response.headers), json };
        } };
    } };
  vm.runInNewContext(code, sandbox);
  const plugin = new sandbox.module.exports();
  plugin.settings = { enableGroq: true, model: report.model, minimumCharacters: 1, maxCharactersPerDay: 60000, outputFolder: 'Mood History', includeFolders: [], excludeFolders: [] };
  plugin.runtime = {}; plugin.records = {}; plugin.groqBlockedUntil = 0;
  plugin.refreshRenderers = () => {}; plugin.savePluginData = async () => {};
  return plugin;
}
async function evaluate(code, text, worker = false) {
  const metrics = { requests: 0, providerMilliseconds: 0, inputTokens: 0, outputTokens: 0, reasoningTokens: 0, rateLimits: 0 };
  const p = loadPlugin(code, metrics);
  const prepared = pipeline.prepareSourceCoverage([{ path: 'Synthetic.md', text }]);
  const started = performance.now(); let result, errorCode;
  try {
    if (worker) result = await p.processPreparedDate('2031-02-03', '2031-02-03', prepared, 'a'.repeat(64), { assertCurrent: () => {} });
    else {
      const chunks = [];
      for (const chunk of prepared.chunks) chunks.push({ chunk, analysis: await p.analyzeWithGroq('2031-02-03', chunk.text, { chunk, requestBudget: { remainingCharacters: 60000 } }) });
      result = pipeline.aggregateChunkAnalyses(chunks);
    }
  } catch (error) { errorCode = error.code || (error.status ? `status_${error.status}` : 'invalid_output'); }
  return { success: Boolean(result), result, errorCode, milliseconds: +(performance.now() - started).toFixed(2), ...metrics,
    chunks: prepared.chunks.length, peakConcurrency: p.runtime.chunkWork?.['2031-02-03']?.metrics?.peakConcurrency || 1 };
}
async function main() {
  if (!process.env.GROQ_API_KEY) throw new Error('GROQ_API_KEY unavailable.');
  for (let repeat = 0; repeat < (args.includes('--workers-only') ? 0 : repeats); repeat++) for (const row of cases) for (const [engine, code] of args.includes('--current-only') ? [['current', currentCode]] : [['1.4.1', baselineCode], ['current', currentCode]]) {
    const evaluation = await evaluate(code, row.text);
    const checks = Object.fromEntries(Object.entries(row.required).map(([axis, range]) => [axis, Number.isFinite(evaluation.result?.[`${axis}Score`]) && evaluation.result[`${axis}Score`] >= range[0] && evaluation.result[`${axis}Score`] <= range[1]]));
    const unsupported = row.unsupported.filter(axis => Number.isFinite(evaluation.result?.[`${axis}Score`]));
    evaluation.scores = Object.fromEntries(pipeline.DIMENSIONS.map(axis => [axis, evaluation.result?.[`${axis}Score`] ?? null]));
    delete evaluation.result;
    report.results.push({ id: row.id, repeat, engine, checks, unsupported, ...evaluation });
    fs.writeFileSync(option('output', '../groq-benchmark.json'), JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report.results.at(-1)));
    if (evaluation.rateLimits) throw new Error('Account rate limit reached; benchmark stopped without clearing provider guidance.');
  }
  if (args.includes('--workers')) {
    const text = Array.from({ length: 10 }, (_, index) => cases[index % cases.length].text + ' ' + `The synthetic notebook section ${index} describes an ordinary shelf and its numbered compartments. `.repeat(28)).join('\n\n');
    report.workers = [];
    report.workerInputHash = crypto.createHash('sha256').update(text).digest('hex');
    const reusedWorkerPath = option('reuse-worker-baseline', '');
    if (reusedWorkerPath) {
      const reused = JSON.parse(fs.readFileSync(reusedWorkerPath, 'utf8'));
      const reusedWorker = reused.workers?.find(row => row.engine === '1.4.1');
      if (!reusedWorker || reused.model !== report.model) throw new Error('Invalid reused worker baseline.');
      report.workers.push(reusedWorker); report.reusedWorkerBaseline = reusedWorkerPath;
    }
    for (const [engine, code] of reusedWorkerPath ? [['current', currentCode]] : [['1.4.1', baselineCode], ['current', currentCode]]) {
      const evaluation = await evaluate(code, text, true); delete evaluation.result;
      report.workers.push({ engine, ...evaluation }); console.log(JSON.stringify({ workerBenchmark: true, engine, ...evaluation }));
    }
  }
  report.implementationHash = measuredImplementationHash;
  report.analysisContractHash = measuredContractHash;
  report.bundleSHA256 = crypto.createHash('sha256').update(currentCode).digest('hex');
  const summary = {};
  for (const engine of ['1.4.1', 'current']) {
    const rows = report.results.filter(row => row.engine === engine);
    if (!rows.length) continue;
    const sorted = rows.map(row => row.milliseconds).sort((a, b) => a - b);
    summary[engine] = { cases: rows.length, successful: rows.filter(row => row.success).length, constraints: rows.reduce((sum, row) => sum + Object.keys(row.checks).length, 0),
      passed: rows.reduce((sum, row) => sum + Object.values(row.checks).filter(Boolean).length, 0), unsupported: rows.reduce((sum, row) => sum + row.unsupported.length, 0),
      requests: rows.reduce((sum, row) => sum + row.requests, 0), inputTokens: rows.reduce((sum, row) => sum + row.inputTokens, 0), outputTokens: rows.reduce((sum, row) => sum + row.outputTokens, 0),
      reasoningTokens: rows.reduce((sum, row) => sum + row.reasoningTokens, 0), medianMilliseconds: sorted[Math.floor(sorted.length / 2)] };
  }
  report.summary = summary;
  if (summary['1.4.1'] && summary.current) report.medianLatencyReduction = 1 - summary.current.medianMilliseconds / summary['1.4.1'].medianMilliseconds;
  fs.writeFileSync(option('output', '../groq-benchmark.json'), JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ summary, medianLatencyReduction: report.medianLatencyReduction, workers: report.workers }));
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
