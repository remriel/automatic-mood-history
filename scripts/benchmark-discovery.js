const assert = require("node:assert/strict");
const Module = require("node:module");
const { execFileSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");
const { fixture, TFile, TFolder } = require("../tests/reliability-fixture");
const baseline = process.argv[2] || "e01f1ed";
const original = Module._load;
Module._load = function(name, ...args) { if (name === "obsidian") return { TFile, TFolder, Plugin: class {}, PluginSettingTab: class {}, Notice: class {} }; return original.call(this, name, ...args); };
const old = new Module(__filename); old._compile(execFileSync("git", ["show", `${baseline}:main.js`], { encoding: "utf8" }), __filename);
Module._load = original;
async function measure(size, before) {
  const f = fixture(); let p = f.p;
  if (before) { const prior = new old.exports(); Object.assign(prior, p); p = prior; }
  p.settings.enableGroq = false; f.files.clear();
  const days = size === 1000 ? 100 : 365;
  for (let index = 0; index < size; index++) { const file = new TFile(`Journal/Fictional ${String(index).padStart(5, "0")}.md`); file.stat.ctime = new Date(2031, 0, 1 + index % days, 12).getTime(); f.files.set(file.path, file); }
  let enumerations = 0, reads = 0;
  const enumerate = p.app.vault.getMarkdownFiles, read = p.app.vault.cachedRead;
  p.app.vault.getMarkdownFiles = () => { enumerations++; return enumerate(); };
  p.app.vault.cachedRead = file => { reads++; return read(file); };
  const start = performance.now();
  const dateIndex = before ? undefined : p.buildDateIndex();
  const targets = p.getAnalysisTargets({ dateIndex }); const hashes = [];
  for (const target of targets) { const gathered = await p.gatherDate(target.date, dateIndex); hashes.push([target.date, gathered.contentHash, gathered.sourcePaths]); }
  return { notes: size, dates: targets.length, enumerations, reads, milliseconds: Math.round(performance.now() - start), hashes };
}
(async () => {
  for (const size of [1000, 10000]) {
    const before = [], after = []; let result;
    for (let round = 0; round < 3; round++) {
      const a = await measure(size, true), b = await measure(size, false); assert.deepEqual(b.hashes, a.hashes);
      before.push(a.milliseconds); after.push(b.milliseconds); result = { baseline, notes: size, dates: b.dates, before: { enumerations: a.enumerations, reads: a.reads }, after: { enumerations: b.enumerations, reads: b.reads }, exactSourceAndHashParity: true };
    }
    result.before.medianMilliseconds = before.sort((a,b) => a-b)[1]; result.after.medianMilliseconds = after.sort((a,b) => a-b)[1];
    console.log(JSON.stringify(result));
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
