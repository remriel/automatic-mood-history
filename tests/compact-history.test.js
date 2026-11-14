const assert = require("node:assert/strict");
const { fixture, date, priorRecord, TFile, clone, buildEntryMarkdown } = require("./reliability-fixture");
const { buildMonthlyMarkdown } = require("../src/sentiment-core");

async function run() {
  const f = fixture(); const { p, disk, files } = f;
  p.settings.entryOutput = "monthly";
  const original = priorRecord();
  p.records[date] = original;
  p.records[`legacy:${date}`] = { ...original, dateBasis: "legacy-note-date", summary: "Fictional legacy result." };
  const before = clone(p.records);
  await p.exportMonthlyHistory();
  const path = "Mood History/Months/2031-02.md";
  assert.equal(p.providerCalls, 0, "export never requests analysis");
  assert.deepEqual(p.records, before, "export preserves every record and identity");
  assert(![...disk.files.keys()].some(path => path.includes("/Entries/")));
  assert(!disk.files.has("Mood History/Mood History.base"));
  assert(!disk.files.get("Mood History/Mood History.md").includes("[[Mood History/Mood History.base"));
  const exported = JSON.parse(disk.files.get(path).match(/```json\n([\s\S]*?)\n```/)[1]);
  assert.deepEqual(exported.records, before, "portable monthly recovery data is lossless");
  assert(!Object.hasOwn(exported, "settings"));
  await p.exportMonthlyHistory();
  assert.equal([...disk.files.keys()].filter(path => path.includes("/Months/")).length, 1);
  assert.equal(await p.analyzeDate(date), true);
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));
  assert(![...disk.files.keys()].some(path => path.includes("/Entries/")));

  // A user-owned or modified document must never be silently replaced.
  disk.files.set(path, disk.files.get(path) + "\nPersonal addition.\n");
  const edited = disk.files.get(path);
  await assert.rejects(p.exportMonthlyHistory(), /edited/);
  assert.equal(disk.files.get(path), edited);
  assert.equal(await p.analyzeDate(date, { force: true }), false);
  assert(Object.keys(p.runtime.pendingWrites).length, "failed output retains prepared result");
  assert.equal(await p.updateSetting("entryOutput", "none"), false, "pending mode cannot change");
  assert.equal(p.entryOutput, "monthly");
  disk.files.delete(path); files.delete(path); // User moves the edited file aside.
  const requests = p.providerCalls;
  assert.equal(await p.analyzeDate(date), true);
  assert.equal(p.providerCalls, requests, "recovery uses saved result");
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));

  // Recover all persisted boundaries without replaying a provider request.
  for (const boundary of ["prepare-after", "export-before", "export-after", "commit-before", "commit-after"]) {
    const f = fixture(); f.p.settings.entryOutput = "monthly";
    let saves = 0;
    const save = f.p.saveData;
    f.p.saveData = async snapshot => {
      const stage = ++saves === 1 ? "prepare" : "commit";
      if (boundary === `${stage}-before`) throw new Error("Interrupted");
      await save(snapshot);
      if (boundary === `${stage}-after`) throw new Error("Interrupted");
    };
    const write = f.p.writeMonthlyNote.bind(f.p);
    f.p.writeMonthlyNote = async (...args) => {
      if (boundary === "export-before") throw new Error("Interrupted");
      await write(...args);
      if (boundary === "export-after") throw new Error("Interrupted");
    };
    assert.equal(await f.p.analyzeDate(date), false, boundary);
    const restart = fixture(f.disk).p;
    restart.settings = clone(f.disk.json.settings); restart.records = clone(f.disk.json.records); restart.runtime = clone(f.disk.json.runtime);
    assert.equal(await restart.analyzeDate(date), true, boundary);
    assert.equal(restart.providerCalls, 0, boundary);
    assert.equal(f.disk.files.get(path), buildMonthlyMarkdown("2031-02", restart.records), boundary);
  }
  const none = fixture(); none.p.settings.entryOutput = "none";
  assert.equal(await none.p.analyzeDate(date), true);
  assert.equal(none.disk.files.size, 0, "dashboard-only commits need no Markdown writes");
  assert(none.disk.json.records[date]);
  const callsBefore = none.p.providerCalls;
  none.p.settings.entryOutput = "daily";
  await none.p.exportDailyHistory();
  assert([...none.disk.files.keys()].some(path => path.includes("/Entries/")), "switching to daily output creates daily entries without provider calls");
  assert.equal(none.p.providerCalls, callsBefore);
  for (const mode of ["monthly", "none"]) {
    const checked = fixture(); checked.p.settings.entryOutput = mode;
    const lookup = checked.p.app.vault.getAbstractFileByPath;
    checked.p.app.vault.getAbstractFileByPath = path => {
      assert.equal(typeof path, "string", "Obsidian must never receive a null file path");
      return lookup(path);
    };
    assert.equal(await checked.p.analyzeDate(date), true, mode);
  }

  // An edit made before a reanalysis or daily export is still user content.
  for (const operation of ["analysis", "export"]) {
    const f = fixture(); const old = priorRecord(); f.p.records[date] = old;
    const edited = buildEntryMarkdown(old) + "\nA personal edit made before this operation.\n";
    f.disk.files.set(old.entryPath, edited); f.files.set(old.entryPath, new TFile(old.entryPath));
    if (operation === "analysis") assert.equal(await f.p.analyzeDate(date), true);
    else await f.p.exportDailyHistory();
    assert.equal(f.disk.files.get(old.entryPath), edited, `${operation}: never overwrite earlier user edits`);
    assert.notEqual(f.p.records[date].entryPath, old.entryPath, `${operation}: use a recovered note`);
    assert.equal(f.disk.files.get(f.p.records[date].entryPath), buildEntryMarkdown(f.p.records[date]));
    const path = f.p.records[date].entryPath;
    await f.p.exportDailyHistory();
    assert.equal(f.p.records[date].entryPath, path, "repeated daily export is idempotent");
    assert.equal(f.p.providerCalls, operation === "analysis" ? 1 : 0);
  }

  // Interruption after writing the replacement preserves both the original
  // edit and the prepared journal; restart commits without another request.
  const interrupted = fixture(); const old = priorRecord(); interrupted.p.records[date] = old;
  const editedOriginal = buildEntryMarkdown(old) + "\nKeep this edit.\n";
  interrupted.disk.files.set(old.entryPath, editedOriginal); interrupted.files.set(old.entryPath, new TFile(old.entryPath));
  const write = interrupted.p.writeEntryNote.bind(interrupted.p);
  interrupted.p.writeEntryNote = async (...args) => { await write(...args); throw new Error("Interrupted after entry write"); };
  await assert.rejects(interrupted.p.exportDailyHistory(), /Interrupted/);
  assert.equal(interrupted.p.records[date], old, "uncommitted export does not mutate live records");
  const resumed = fixture(interrupted.disk).p;
  resumed.settings = clone(interrupted.disk.json.settings);
  resumed.records = clone(interrupted.disk.json.records);
  resumed.runtime = clone(interrupted.disk.json.runtime);
  await resumed.recoverPendingWrites();
  assert.equal(interrupted.disk.files.get(old.entryPath), editedOriginal);
  assert.notEqual(resumed.records[date].entryPath, old.entryPath);
  assert.equal(resumed.providerCalls, 0);
  assert.equal(Object.keys(resumed.runtime.pendingWrites).length, 0);
  assert.equal(none.p.validateSettings({ entryOutput: "invalid" }).entryOutput, "daily");
  assert.equal(none.p.validateSettings({ entryOutput: "monthly" }).entryOutput, "monthly");
  assert.throws(() => none.p.monthlyPath("../../escape"), /Invalid/);
  console.log("PASS compact history: lossless exports, identities, no daily files, protected edits, restart recovery and dashboard-only persistence");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
