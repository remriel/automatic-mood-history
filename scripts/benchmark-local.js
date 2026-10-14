// Synthetic parity/performance probe; never reads a vault or calls a provider.
const assert = require("node:assert/strict");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const current = require("../src/sentiment-core");
const baselineRef = process.argv[2] || "493f53c";
const baselineModule = { exports: {} };
const source = execFileSync("git", ["show", `${baselineRef}:src/sentiment-core.js`], { encoding: "utf8", cwd: require("node:path").resolve(__dirname, "..") });
new Function("module", source)(baselineModule);
const baseline = baselineModule.exports;
const terms = "happy sad calm exhausted friends alone love loving loved hopeful hopeless no energy burned out don't understand NOTHING café 愛 fear fearful joy playful guilt ashamed content satisfied excited worried".split(" ");
let seed = 1234567;
for (let sample = 0; sample < 512; sample++) {
  const tokens = [];
  for (let i = 0; i < sample % 150; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    tokens.push(terms[seed % terms.length]);
  }
  const text = tokens.join(sample % 2 ? "! " : "\n");
  assert.deepEqual(current.localSentiment(text), baseline.localSentiment(text));
}
const text = (terms.join(" ") + ". ").repeat(300).slice(0, 60000);
function elapsed(core) {
  const start = performance.now();
  for (let i = 0; i < 40; i++) core.localSentiment(text);
  return performance.now() - start;
}
elapsed(baseline); elapsed(current);
const oldTimes = [], newTimes = [];
for (let i = 0; i < 7; i++) {
  if (i % 2) { newTimes.push(elapsed(current)); oldTimes.push(elapsed(baseline)); }
  else { oldTimes.push(elapsed(baseline)); newTimes.push(elapsed(current)); }
}
const median = values => values.sort((a, b) => a - b)[3];
const before = median(oldTimes), after = median(newTimes);
console.log(JSON.stringify({ baselineRef, node: process.version, paritySamples: 512, characters: text.length, iterationsPerRound: 40, rounds: 7, medianBeforeMs: Math.round(before), medianAfterMs: Math.round(after), speedup: +(before / after).toFixed(2) }, null, 2));
