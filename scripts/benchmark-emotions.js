// Offline, reproducible engineering evaluation. No personal notes/provider use.
const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const current = require("../src/sentiment-core");
const { synthetic, publicJournals, violations } = require("../tests/fixtures/emotional-cases");
const ref = process.argv[2] || "aea50c2";
const baselineModule = { exports: {} };
new Function("module", execFileSync("git", ["show", `${ref}:src/sentiment-core.js`], { encoding: "utf8" }))(baselineModule);
const baseline = baselineModule.exports;
const scoreKeys = ["moodScore", "energyScore", "connectionScore", "intensityScore"];
function evaluate(core, cases) {
  const failures = [];
  let passed = 0, abstentionCorrect = 0, abstentionTotal = 0, scoredCorrect = 0, scoredTotal = 0;
  for (const sample of cases) {
    const result = core.localSentiment(sample.text);
    const errors = violations(result, sample.expected);
    if (!errors.length) passed++;
    else failures.push({ id: sample.id, errors });
    for (const key of scoreKeys) {
      const expected = sample.expected.allNull ? null : sample.expected[key];
      if (expected === null) { abstentionTotal++; if (result[key] === null) abstentionCorrect++; }
      else if (expected) { scoredTotal++; if (Number.isFinite(result[key]) && result[key] >= expected[0] && result[key] <= expected[1]) scoredCorrect++; }
    }
  }
  return { cases: cases.length, passed, abstentionCorrect, abstentionTotal, scoredCorrect, scoredTotal, failures };
}
const texts = {
  everyday5000: Array.from({ length: 100 }, (_, i) => `I feel ${i % 2 ? "calm" : "anxious"} about task ${i} after work. I am tired. `).join("").slice(0, 5000),
  journal60000: ("I feel sad after work, but I am supported by my partner. I feel tired and restless. ").repeat(900).slice(0, 60000),
  varied60000: Array.from({ length: 1200 }, (_, i) => `I feel ${i % 2 ? "calm" : "anxious"} about task ${i} after work. I am ${i % 3 ? "exhausted" : "refreshed"}. `).join("").slice(0, 60000),
  unbroken60000: "x".repeat(60000),
  maximum200000: "I feel happy and tired about the situation ".repeat(5000).slice(0, 200000),
  variedMaximum200000: Array.from({ length: 4000 }, (_, i) => `I feel ${i % 2 ? "calm" : "anxious"} about task ${i} after work. I am ${i % 3 ? "exhausted" : "refreshed"}. `).join("").slice(0, 200000)
};
function timings(core, text) {
  const times = [];
  for (let round = 0; round < 9; round++) {
    const start = performance.now(); core.localSentiment(text); const elapsed = performance.now() - start;
    if (round > 1) times.push(elapsed);
  }
  times.sort((a,b) => a-b);
  return { characters: text.length, medianMs: +times[3].toFixed(2), maxMs: +times.at(-1).toFixed(2) };
}
const output = { baselineRef: ref, engine: current.ENGINE_VERSION, node: process.version,
  description: "Developer-authored text constraints, not clinical labels. Public-domain translated historical journals are a small external sanity check, not a held-out clinical validation set.",
  synthetic: { before: evaluate(baseline, synthetic), after: evaluate(current, synthetic) },
  publicJournals: { before: evaluate(baseline, publicJournals), after: evaluate(current, publicJournals) },
  performance: Object.fromEntries(Object.entries(texts).map(([key, text]) => [key, { before: timings(baseline, text), after: timings(current, text) }])) };
console.log(JSON.stringify(output, null, 2));
const outputArg = process.argv[3];
if (outputArg) fs.writeFileSync(path.resolve(outputArg), JSON.stringify(output, null, 2) + "\n");
if (output.synthetic.after.failures.length || output.publicJournals.after.failures.length) process.exitCode = 1;
