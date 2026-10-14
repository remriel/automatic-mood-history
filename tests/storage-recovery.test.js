const assert = require("node:assert/strict");
const { fixture, date, priorRecord, buildEntryMarkdown, TFile, clone, deferred } = require("./reliability-fixture");
async function run() {
  for (const boundary of ["prepare-before", "prepare-after", "entry-before", "entry-after", "commit-before", "commit-after"]) {
    const f = fixture(); const { p, disk, files } = f; const old = priorRecord();
    p.records[date] = old; disk.files.set(old.entryPath, buildEntryMarkdown(old)); files.set(old.entryPath, new TFile(old.entryPath));
    await p.savePluginData();
    let saves = 0;
    const save = p.saveData;
    p.saveData = async value => {
      saves++;
      const stage = saves === 1 ? "prepare" : "commit";
      if (boundary === `${stage}-before`) { p.unloaded = true; throw new Error("Interrupted before save"); }
      await save(value);
      if (boundary === `${stage}-after`) { p.unloaded = true; throw new Error("Interrupted after save"); }
    };
    const process = p.app.vault.process;
    p.app.vault.process = async (...args) => {
      if (boundary === "entry-before") { p.unloaded = true; throw new Error("Interrupted before note"); }
      await process(...args);
      if (boundary === "entry-after") { p.unloaded = true; throw new Error("Interrupted after note"); }
    };
    assert.equal(await p.analyzeDate(date), false, boundary);
    assert.equal(p.records[date], old, `${boundary}: old committed result remains visible`);
    const restart = fixture(disk).p;
    restart.settings = clone(disk.json.settings); restart.records = clone(disk.json.records); restart.runtime = clone(disk.json.runtime);
    await restart.analyzeDate(date);
    const record = restart.records[date];
    assert.equal(record.summary, "Fictional new result.", boundary);
    assert.equal(disk.files.get(record.entryPath), buildEntryMarkdown(record), `${boundary}: JSON and Markdown converge`);
    assert.equal(restart.runtime.pendingWrites?.[date], undefined, boundary);
    assert.equal(restart.providerCalls, boundary === "prepare-before" ? 1 : 0, `${boundary}: persisted results never call Groq again`);
    console.log(`PASS restart at ${boundary}`);
  }
  const f = fixture(); const { p, disk, files } = f; const old = priorRecord(); p.records[date] = old;
  disk.files.set(old.entryPath, buildEntryMarkdown(old)); files.set(old.entryPath, new TFile(old.entryPath));
  const save = p.saveData; let saves = 0;
  p.saveData = async value => { if (++saves === 2) throw new Error("Commit unavailable"); await save(value); };
  assert.equal(await p.analyzeDate(date), false);
  const edited = buildEntryMarkdown(old) + "\nFictional user edit after interruption.\n";
  disk.files.set(old.entryPath, edited);
  p.saveData = save;
  assert.equal(await p.analyzeDate(date), true);
  assert.equal(disk.files.get(old.entryPath), edited, "recovery preserves edited owned notes");
  assert.notEqual(p.records[date].entryPath, old.entryPath);
  assert.equal(p.providerCalls, 1);

  const serial = fixture(); const first = deferred(); let active = 0, maximum = 0, calls = 0;
  serial.p.saveData = async value => { maximum = Math.max(maximum, ++active); if (++calls === 1) await first.promise; serial.disk.json = clone(value); active--; };
  const a = serial.p.savePluginData(); await Promise.resolve();
  serial.p.settings.enableGroq = false; serial.p.runtime.marker = "newer";
  const b = serial.p.savePluginData(); first.resolve(); await Promise.all([a, b]);
  assert.equal(maximum, 1); assert.equal(serial.disk.json.settings.enableGroq, false); assert.equal(serial.disk.json.runtime.marker, "newer");
  serial.p.settings.model = "later";
  assert.notEqual(serial.disk.json.settings.model, "later", "saved snapshots never alias mutable settings");
  console.log("PASS edited-note recovery and serialized detached JSON snapshots");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
