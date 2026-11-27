const assert = require("node:assert/strict");
const { fixture, date, priorRecord, TFile, clone, buildEntryMarkdown } = require("./reliability-fixture");
const { buildMonthlyMarkdown, sha256 } = require("../src/sentiment-core");
const { Element } = require("./dashboard-dom-fixture");

async function run() {
  const f = fixture(); const { p, disk, files } = f;
  p.settings.entryOutput = "monthly";
  const original = priorRecord();
  p.records[date] = original;
  p.records[`legacy:${date}`] = { ...original, dateBasis: "legacy-note-date", summary: "Fictional legacy result." };
  const before = clone(p.records);
  const path = "Mood History/Months/2031-02.md";
  disk.files.set(path, buildMonthlyMarkdown("2031-02", before, { originalScale: true }));
  files.set(path, new TFile(path));
  assert(disk.files.get(path).includes("**Mood:** 4/5"));
  await p.exportMonthlyHistory();
  assert(disk.files.get(path).includes("**Mood:** 8/10"), "an unedited old export can be refreshed without changing its recovery values");
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
  assert.equal(p.records[date].scoreScale, 10);
  assert.equal(p.validateRecords({ [date]: { ...p.records[date], moodScore: 9 } })[date].moodScore, 9);
  assert(![...disk.files.keys()].some(path => path.includes("/Entries/")));

  // A synced monthly export can survive the loss of the plugin's data.json.
  const backup = buildMonthlyMarkdown("2031-02", before).replace(/\n/g, "\r\n") + "\r\nPersonal addition.\r\n";
  const recovery = fixture({ json: { settings: { entryOutput: "monthly" }, records: {}, runtime: {} }, files: new Map([[path, backup]]) });
  const root = new Element();
  root.rootConnected = true;
  const cleanup = [];
  recovery.p.register = callback => cleanup.push(callback);
  recovery.p.registerForegroundRecovery = () => {};
  delete recovery.p.refreshRenderers;
  await recovery.p.onload();
  recovery.p.renderContainers.add(root);
  recovery.p.renderDashboard(root);
  assert(root.textContent.includes("No history yet"));
  try { await recovery.p.layoutReady(); } finally { cleanup.forEach(callback => callback()); }
  assert(root.walk().some(node => node.classList.contains("auto-mood-card-value") && node.textContent === "1"), "startup restore redraws the open dashboard");
  assert.deepEqual(recovery.disk.json.records, recovery.p.records, "restored scores survive restart");
  assert.equal(recovery.p.records[date].moodScore, original.moodScore);
  assert.equal(recovery.p.providerCalls, 0, "restore never requests analysis");
  assert.equal(recovery.disk.files.get(path), backup, "restore leaves the entire export intact");
  assert.deepEqual(await recovery.p.restoreMonthlyHistory(), { count: 0, skippedMonths: 0 });
  recovery.p.onunload();

  const partial = fixture({ json: null, files: new Map([[path, buildMonthlyMarkdown("2031-02", before)],
    ["Mood History/Months/2031-03.md", "# Unrelated note"],
    ["Other/Months/2031-02.md", backup]]) });
  const newer = { ...original, moodScore: 5 };
  partial.p.records[`detected:${date}`] = newer;
  assert.deepEqual(await partial.p.restoreMonthlyHistory(), { count: 1, skippedMonths: 1 });
  assert.strictEqual(partial.p.records[`detected:${date}`], newer, "cache wins over an exported copy of the same date and basis");
  assert.equal(partial.p.records[`legacy:${date}`].dateBasis, "legacy-note-date");
  const failSave = fixture({ json: null, files: new Map([[path, backup]]) });
  failSave.p.saveData = async () => { throw new Error("Storage unavailable"); };
  await assert.rejects(failSave.p.restoreMonthlyHistory(), /Storage unavailable/);
  assert.deepEqual(failSave.p.records, {}, "a failed save does not publish restored records");

  const stale = fixture({ json: null, files: new Map([[path, buildMonthlyMarkdown("2031-02", before)]]) });
  const preserved = stale.disk.files.get(path);
  stale.p.settings.entryOutput = "monthly";
  stale.p.records[date] = newer;
  stale.p.runtime.monthlyExportHashes = { [path]: sha256(preserved) };
  await assert.rejects(stale.p.exportMonthlyHistory(), /missing history/);
  assert.equal(stale.disk.files.get(path), preserved, "a remembered hash cannot authorize dropping exported scores");

  // A user-owned or modified document must never be silently replaced.
  disk.files.set(path, disk.files.get(path) + "\nPersonal addition.\n");
  const edited = disk.files.get(path);
  p.records["2031-03-01"] = { ...original, date: "2031-03-01" };
  await p.exportMonthlyHistory();
  assert(disk.files.has("Mood History/Months/2031-03.md"));
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));
  assert([...disk.files.entries()].some(([name, content]) => name.includes("/Preserved monthly notes/") && content === edited));
  assert.equal(await p.analyzeDate(date, { force: true }), true);
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));
  assert([...disk.files.entries()].some(([name, content]) => name.includes("/Preserved monthly notes/") && content === edited));
  assert.equal(disk.json.runtime.monthlyExportConflicts?.[path], undefined);
  assert.deepEqual(disk.json.records, p.records);
  assert.equal(Object.keys(p.runtime.pendingWrites).length, 0);
  disk.files.delete(path); files.delete(path);
  const requests = p.providerCalls;
  await p.exportMonthlyHistory();
  assert.equal(p.providerCalls, requests);
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));

  // Even when scoring has nothing new, reconcile a stale generated snapshot.
  disk.files.set(path, buildMonthlyMarkdown("2031-02", before, { originalScale: true }));
  delete p.runtime.monthlyExportHashes;
  const savedTargets = p.getAnalysisTargets;
  p.getAnalysisTargets = () => [];
  await p.analyzeAll({ silent: true });
  p.getAnalysisTargets = savedTargets;
  assert.equal(p.providerCalls, requests);
  assert.equal(disk.files.get(path), buildMonthlyMarkdown("2031-02", p.records));
  const newerExport = clone(p.records);
  newerExport[date].analyzedAt = "2099-01-01T00:00:00Z";
  const future = buildMonthlyMarkdown("2031-02", newerExport);
  disk.files.set(path, future);
  await assert.rejects(p.exportMonthlyHistory(), /needing review/);
  assert.equal(disk.files.get(path), future, "preserve a newer synced result");

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
  assert.equal(none.p.validateSettings({ entryOutput: "invalid" }).entryOutput, "monthly");
  assert.equal(none.p.validateSettings({}).entryOutput, "monthly");
  assert.equal(none.p.validateSettings({ entryOutput: "monthly" }).entryOutput, "monthly");
  for (const mode of ["daily", "monthly", "none"]) {
    const saved = fixture(); saved.p.loadData = async () => ({ settings: { entryOutput: mode }, records: {}, runtime: {} });
    await saved.p.onload();
    assert.equal(saved.p.entryOutput, mode, "a saved output choice is never changed by the new default");
    assert.equal(saved.p.providerCalls, 0);
  }
  const fresh = fixture(); fresh.p.loadData = async () => ({ settings: {}, records: {}, runtime: {} });
  await fresh.p.onload();
  assert.equal(fresh.p.entryOutput, "monthly");
  assert.equal(fresh.disk.json.settings.entryOutput, "monthly", "the monthly default is persisted on a fresh installation");
  assert.equal(fresh.p.providerCalls, 0);
  const legacy = fixture();
  legacy.p.loadData = async () => ({ settings: {}, records: {}, runtime: { pendingWrites: {
    [date]: { version: 1, outputFolder: "Mood History", record: priorRecord(), expectedHash: null }
  } } });
  await legacy.p.onload();
  assert.equal(legacy.p.entryOutput, "daily", "legacy pending daily writes retain their required output mode");
  await legacy.p.recoverPendingWrites();
  assert(legacy.disk.files.has(`Mood History/Entries/${date}.md`), "legacy pending result recovers without a new provider request");
  assert.equal(legacy.p.providerCalls, 0);
  assert.equal(Object.keys(legacy.p.runtime.pendingWrites).length, 0);
  assert.throws(() => none.p.monthlyPath("../../escape"), /Invalid/);
  console.log("PASS compact history: lossless exports, identities, no daily files, protected edits, restart recovery and dashboard-only persistence");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
