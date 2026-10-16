const fs = require('node:fs');
const vm = require('node:vm');
const { performance } = require('node:perf_hooks');
const { execFileSync } = require('node:child_process');
const pipeline = require('../src/analysis-pipeline');
const oldEngine = { module: { exports: {} } };
vm.runInNewContext(execFileSync('git', ['show', '6f17fcc:src/emotional-engine.js'], { encoding: 'utf8' }), oldEngine);
const oldCore = { module: { exports: {} }, require: () => oldEngine.module.exports, TextEncoder };
vm.runInNewContext(execFileSync('git', ['show', '6f17fcc:src/sentiment-core.js'], { encoding: 'utf8' }), oldCore);
const baseline = oldCore.module.exports;
const sample = size => Array.from({ length: Math.ceil(size / 116) }, (_, i) => `I feel hopeful about project ${i}. I feel exhausted after work but supported by my friends. This is milestone ${i}.`).join('\n\n').slice(0, size);
const scenarios = [
  { name: 'small', sources: [{ path: 'Synthetic.md', text: sample(500) }] },
  { name: 'long-date', sources: [{ path: 'Synthetic.md', text: sample(60000) }] },
  { name: 'large-date', sources: [{ path: 'Synthetic.md', text: sample(200000) }] },
  { name: 'many-files', sources: Array.from({ length: 1000 }, (_, i) => ({ path: `Synthetic/${i}.md`, text: `I feel hopeful about milestone ${i}. I feel supported by my friends.` })) }
];
const rows = [];
for (const scenario of scenarios) {
  const measurements = { baseline: [], current: [] }; let retained;
  for (let iteration = 0; iteration < 12; iteration++) {
    let started = performance.now();
    const text = baseline.textForAnalysis(baseline.deduplicateParagraphs(scenario.sources.map(item => item.text))).slice(0, 60000);
    const oldRecord = baseline.localSentiment(text);
    baseline.sha256(JSON.stringify({ sourcePaths: scenario.sources.map(item => item.path), analysisText: text }));
    measurements.baseline.push(performance.now() - started);
    started = performance.now();
    const prepared = pipeline.prepareSourceCoverage(scenario.sources);
    const analyses = prepared.chunks.map(chunk => ({ chunk, analysis: pipeline.localChunkAnalysis(chunk) }));
    const result = pipeline.aggregateChunkAnalyses(analyses);
    measurements.current.push(performance.now() - started);
    retained = { eligibleCharacters: prepared.accounting.eligibleCharacters, chunks: prepared.chunks.length,
      baselineProcessedCharacters: text.length, finalEvidenceBytes: Buffer.byteLength(JSON.stringify(result)),
      finalMappingBytes: Buffer.byteLength(JSON.stringify(prepared.sourceMap.map(item => [item.passageId || null, scenario.sources.findIndex(source => source.path === item.path), item.rawStart, item.rawEnd, item.cleanedStart ?? 0, item.cleanedEnd ?? 0, item.duplicateOf || null]))),
      baselineRecordBytes: Buffer.byteLength(JSON.stringify(oldRecord)),
      pendingMetadataBytes: Buffer.byteLength(JSON.stringify({ sourceMap: prepared.sourceMap, chunks: analyses.map(({ chunk, analysis }) => ({ id: chunk.id, state: 'complete', analysis })) })) };
  }
  const median = values => [...values].sort((a,b)=>a-b)[Math.floor(values.length/2)];
  rows.push({ scenario: scenario.name, baselineMedianMilliseconds: +median(measurements.baseline).toFixed(2), currentMedianMilliseconds: +median(measurements.current).toFixed(2), ...retained });
}
const report = { version: 1, node: process.version, samplesPerScenario: 12, note: 'Local CPU measurement including preparation/hash/interpretation/aggregation. Baseline silently truncates at 60,000 characters; current covers all eligible text. Pending metadata is deleted after durable commit.', rows };
fs.writeFileSync('docs/COVERAGE_PERFORMANCE.json', JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
