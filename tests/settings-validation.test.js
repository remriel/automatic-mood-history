const assert = require("node:assert/strict");
const { fixture, date, priorRecord, clone } = require("./reliability-fixture");
async function run() {
  for (const loaded of [null, [], "corrupt", { settings: [], records: [null], runtime: [] }, { settings: { enableGroq: "false", autoAnalyze: 1, analyzeOnStartup: "true", outputFolder: 3, includeFolders: {}, excludeFolders: null }, records: { [date]: null }, runtime: { pendingDates: [null], pendingWrites: "bad", lastGroqIssue: true } }]) {
    const { p } = fixture(); p.loadData = async () => loaded;
    await p.onload(); assert.equal(p.settings.enableGroq, false); assert.equal(p.settings.autoAnalyze, false);
    assert.deepEqual(p.records, {}); assert.equal(p.providerCalls, 0); p.onunload();
  }
  let { p } = fixture();
  const old = priorRecord(); p.loadData = async () => ({ settings: { includeFolders: ["Journal/../Private"], enableGroq: true, autoAnalyze: true }, records: { [date]: clone(old) } });
  await p.onload(); assert(p.settingsValidationError); assert.equal(p.getAllDates().length, 0);
  assert.equal(await p.analyzeDate(date), false); assert.equal(p.providerCalls, 0);
  assert.equal(await p.updateFolderFilter("includeFolders", "Journal\\Notes//"), true);
  assert.deepEqual(p.settings.includeFolders, ["Journal/Notes"]); assert.equal(p.settingsValidationError, "");
  p.settings.includeFolders = ["Journal"];
  for (const value of ["../Private", "Journal/./Private", "C:\\Journal", "/Journal", ["Journal", 7], {}]) {
    assert.equal(await p.updateFolderFilter("includeFolders", value), false);
    assert.deepEqual(p.settings.includeFolders, ["Journal"], "invalid allowlist never widens access");
  }
  await p.updateFolderFilter("includeFolders", "/\nJournal//Notes"); assert.deepEqual(p.settings.includeFolders, ["/", "Journal/Notes"]);

  for (const value of ["", "/", "../Journal", "Mood History/../Journal", "Mood History/./Entries", "C:\\Journal", "\\\\server\\share", ".obsidian", ".trash/X", "Mood\nHistory", "Mood History/NUL", "Mood History/trailing."]) {
    const f = fixture(); f.p.settings.outputFolder = value;
    await assert.rejects(f.p.ensureSupportFiles(), undefined, String(value)); assert.equal(f.disk.files.size, 0);
  }
  for (const path of ["Mood History/Entries/../../Journal/Fictional.md", "Mood History/Entries/./X.md", "Mood History/Entries/C:/X.md", "Journal/Fictional.md"]) {
    const f = fixture(); const resolved = await f.p.resolveEntryPath({ date, entryPath: path });
    assert.equal(resolved, `Mood History/Entries/${date}.md`);
    await assert.rejects(f.p.writeEntryNote({ ...old, entryPath: path }, { pending: { expectedHash: null }, key: date }));
    assert.equal(f.disk.files.size, 0);
  }
  ({ p } = fixture()); p.watchSettings(); p.saveData = async () => { throw new Error("Unavailable"); };
  assert.equal(await p.updateSetting("enableGroq", false), false); assert.equal(p.settings.enableGroq, false);
  assert.equal(p.settingsSaveFailed, true); assert.equal(await p.analyzeDate(date), false); assert.equal(p.providerCalls, 0);
  p.saveData = async () => {}; assert.equal(await p.updateSetting("enableGroq", false), true); assert.equal(p.settingsSaveFailed, false);

  ({ p } = fixture()); p.loadData = async () => ({ settings: { minimumCharacters: -5, maxCharactersPerDay: Infinity, debounceMilliseconds: 1, hiddenChartSeries: ["moodScore", "moodScore", "invalid"] }, records: { bad: { date: "bad" }, [date]: { ...old, sourcePaths: ["Journal/Fictional.md", null] } }, runtime: { pendingDates: { [date]: { retryAt: "invalid" } }, pendingWrites: { [date]: { version: 999 } } } });
  await p.onload(); assert.equal(p.settings.minimumCharacters, 1); assert.equal(p.settings.maxCharactersPerDay, 60000);
  assert.equal(p.settings.debounceMilliseconds, 250); assert.deepEqual(p.settings.hiddenChartSeries, ["moodScore"]);
  assert.equal(p.records[date].sourcePathsInvalid, true); assert.deepEqual(p.runtime.pendingDates, {}); assert.deepEqual(p.runtime.pendingWrites, {});
  assert.equal(p.records.bad, undefined);
  ({ p } = fixture()); p.loadData = async () => { throw new Error("Sync unavailable"); }; let saves = 0; p.saveData = async () => saves++;
  await p.onload(); assert.equal(saves, 0, "an unreadable data file is never overwritten with defaults"); assert.equal(await p.analyzeDate(date), false);
  console.log("PASS corrupt storage, fail-closed scope, path confinement, consent-save failures and unreadable JSON preservation");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
