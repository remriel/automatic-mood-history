const assert = require("node:assert/strict");
const { fixture, date, clone, TFile, priorRecord, buildEntryMarkdown } = require("./reliability-fixture");
async function run() {
  const f = fixture(); const { p, disk, files } = f;
  const legacy = { ...priorRecord(), dateBasis: "legacy-note-date", summary: "Fictional legacy preserved." };
  p.records[date] = legacy; disk.files.set(legacy.entryPath, buildEntryMarkdown(legacy)); files.set(legacy.entryPath, new TFile(legacy.entryPath));
  await p.savePluginData(); const original = clone(disk.json), originalMarkdown = disk.files.get(legacy.entryPath);
  const targets = p.getAnalysisTargets(); assert.equal(targets.length, 2); assert.equal(new Set(targets.map(target => target.recordKey)).size, 2);
  const save = p.saveData; let saves = 0;
  p.saveData = async value => { if (++saves === 2) throw new Error("Fictional interrupted collision commit"); await save(value); };
  await p.analyzeDate(date); assert.deepEqual(p.records[date], legacy); assert.equal(disk.files.get(legacy.entryPath), originalMarkdown);
  assert(p.runtime.pendingWrites[`created:${date}`]);
  const restarted = fixture(disk).p; await restarted.onload(); await restarted.recoverPendingWrites();
  assert.equal(restarted.providerCalls, 0); assert.equal(Object.keys(restarted.records).length, 2);
  const current = restarted.records[`created:${date}`]; assert.equal(current.date, date); assert.equal(current.dateBasis, "created-at-local-date");
  assert.notEqual(current.entryPath, legacy.entryPath); assert.equal(disk.files.get(legacy.entryPath), originalMarkdown);
  assert.deepEqual(restarted.records[date], legacy); assert.deepEqual(current.sourcePaths, legacy.sourcePaths);
  assert.equal(disk.files.get(current.entryPath), buildEntryMarkdown(current));
  const schema2 = clone(disk.json); disk.json = original;
  const rollback = fixture(disk).p; await rollback.onload();
  assert.deepEqual(rollback.records[date], legacy); assert.equal(Object.keys(rollback.records).length, 1);
  assert(schema2.records[`created:${date}`], "the additional group remains available in the saved schema 2 snapshot");
  const reverse = fixture(); reverse.p.records[date] = { ...priorRecord() };
  assert.equal(reverse.p.recordKey(date, true), `legacy:${date}`); assert.equal(reverse.p.recordKey(date), date);
  console.log("PASS same-date coexistence, interrupted collision recovery, preserved entry links and additive migration rollback");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
