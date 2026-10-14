const assert = require("node:assert/strict");
const { fixture, date, TFile } = require("./reliability-fixture");
async function run() {
  let { p } = fixture(); p.settings.enableGroq = false;
  let topic = "Fictional original topic";
  p.app.metadataCache.getFileCache = () => ({ frontmatter: { topic } });
  await p.analyzeDate(date); const original = p.records[date];
  assert.equal(await p.analyzeDate(date), false);
  topic = "Fictional changed topic"; assert.equal(await p.analyzeDate(date), true);
  assert.equal(p.records[date].summary, topic); assert.notEqual(p.records[date].analysisFingerprint, original.analysisFingerprint);
  p.settings.minimumCharacters = 500; await p.analyzeDate(date); assert.equal(p.records[date].status, "insufficient");
  ({ p } = fixture()); await p.analyzeDate(date); const remote = p.records[date]; p.settings.model = "changed";
  await p.analyzeDate(date); assert.equal(p.providerCalls, 1); assert.equal(p.records[date], remote);
  await p.analyzeDate(date, { force: true }); assert.equal(p.providerCalls, 2); assert.notEqual(p.records[date].analysisFingerprint, remote.analysisFingerprint);
  delete p.records[date].analysisFingerprint; const legacy = p.records[date];
  await p.analyzeDate(date); assert.equal(p.providerCalls, 2); assert.equal(p.records[date], legacy);

  const f = fixture(); p = f.p; p.settings.enableGroq = false;
  f.files.set("Journal/Next.md", new TFile("Journal/Next.md", 4));
  let enumerations = 0; const enumerate = p.app.vault.getMarkdownFiles;
  p.app.vault.getMarkdownFiles = () => { enumerations++; return enumerate(); };
  await p.analyzeAll({ silent: true }); assert.equal(enumerations, 1); assert.equal(Object.keys(p.records).length, 2);
  for (const operation of ["delete", "rename", "scope"]) {
    const f = fixture(); const index = f.p.buildDateIndex();
    if (operation === "delete") f.files.delete(f.source.path);
    if (operation === "rename") f.source.path = "Journal/Moved.md";
    if (operation === "scope") f.p.settings.includeFolders = ["Other"];
    await assert.rejects(f.p.gatherDate(date, index), error => error.code === "analysis_cancelled");
    assert.equal(f.p.providerCalls, 0);
  }
  const changed = fixture(); changed.p.app.vault.cachedRead = async file => { file.stat.mtime = 1; return "Fictional sufficient text describing calm and hopeful feelings."; };
  assert.equal(await changed.p.analyzeDate(date), false); assert.equal(changed.p.providerCalls, 0);
  console.log("PASS local semantics, explicit remote refresh, conservative old fingerprints and one-enumeration scan with rename/delete/scope guards");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
