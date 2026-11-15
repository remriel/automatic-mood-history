const assert = require("node:assert/strict");
const { fixture, date, priorRecord, clone } = require("./reliability-fixture");
const { buildMonthlyMarkdown } = require("../src/sentiment-core");

async function run() {
  const month = date.slice(0, 7);
  const second = "2031-03-04";
  const original = priorRecord();
  const old = { [date]: original, [second]: { ...original, date: second } };
  const latest = {
    [date]: { ...original, summary: "A newer fictional result.", contentHash: "new-content" },
    [second]: { ...old[second], summary: "Another newer fictional result.", contentHash: "newer-content" }
  };
  const editedPath = `Mood History/Months/${month}.md`;
  const plainPath = "Mood History/Months/2031-03.md";
  const edited = buildMonthlyMarkdown(month, old) + "\nHuman edit retained.\n";
  const f = fixture({ json: null, files: new Map([
    [editedPath, edited], [plainPath, buildMonthlyMarkdown("2031-03", old)]
  ]) });
  const { p, disk, files } = f;
  p.settings.entryOutput = "monthly";
  p.runtime.pendingWrites = Object.fromEntries(Object.entries(latest).map(([key, record]) => [key, {
    version: 1, entryOutput: "monthly", outputFolder: "Mood History", record, expectedHash: null
  }]));
  p.runtime.pendingDates = Object.fromEntries(Object.keys(latest).map(key => [key, {
    kind: "storage", attempts: 1, retryAt: new Date(0).toISOString(), legacySources: false
  }]));
  let saves = 0;
  const save = p.saveData;
  p.saveData = async value => { saves++; await save(value); };
  p.analyzeWithGroq = async () => { throw new Error("Recovery must not call a provider"); };
  await p.recoverPendingWrites();
  assert.equal(p.providerCalls, 0);
  assert.equal(saves, 3, "restore plus batched journal saves regardless of date count");
  assert.deepEqual(Object.keys(p.runtime.pendingWrites), []);
  assert.deepEqual(Object.keys(p.runtime.pendingDates), []);
  assert.equal(p.records[date].summary, latest[date].summary);
  assert.equal(p.records[second].summary, latest[second].summary);
  assert.equal(disk.files.get(editedPath), edited, "a human edit is preserved");
  assert.equal(disk.files.get(plainPath), buildMonthlyMarkdown("2031-03", p.records));
  assert(p.groqStatus().text.includes("edited monthly export"));
  assert(disk.json.runtime.monthlyExportConflicts[editedPath]);

  disk.files.delete(editedPath); files.delete(editedPath);
  await p.exportMonthlyHistory();
  assert.equal(disk.files.get(editedPath), buildMonthlyMarkdown(month, p.records));
  assert.equal(p.runtime.monthlyExportConflicts[editedPath], undefined);

  const cached = fixture();
  cached.p.settings.autoAnalyze = true;
  cached.source.stat.mtime = Date.now();
  cached.source.stat.size = 80;
  let sourceReads = 0;
  const read = cached.p.app.vault.cachedRead;
  cached.p.app.vault.cachedRead = async file => {
    if (file === cached.source) sourceReads++;
    return read(file);
  };
  await cached.p.analyzeDate(date);
  assert.equal(sourceReads, 1);
  await cached.p.analyzeAll({ background: true, silent: true });
  assert.equal(sourceReads, 1, "unchanged metadata avoids another source read");
  cached.p.records[date].sourceRevisionCheckedAt = new Date(0).toISOString();
  await cached.p.analyzeAll({ background: true, silent: true });
  assert.equal(sourceReads, 2, "periodic content verification still detects silent sync changes");
  cached.p.handleSourceEvent(cached.source);
  await cached.p.analyzeDate(date);
  assert.equal(sourceReads, 3, "a source event invalidates the metadata shortcut");
  assert.equal(cached.p.providerCalls, 1, "unchanged content never calls the provider twice");
  console.log("PASS batched recovery, edited monthly note protection, source cache, and periodic verification");
}

run().catch(error => { console.error(error); process.exitCode = 1; });
