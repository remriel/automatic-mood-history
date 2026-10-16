const assert = require("node:assert/strict");
const Module = require("node:module");
class TFile {
  constructor(path) {
    this.path = path;
    this.extension = "md";
    this.stat = { ctime: new Date(2031, 1, 3, 12).getTime() };
  }
}
const originalLoad = Module._load;
Module._load = function (name, ...args) {
  if (name === "obsidian") return { Plugin: class {}, PluginSettingTab: class {}, TFile, TFolder: class {}, Notice: class {} };
  return originalLoad.call(this, name, ...args);
};
const Mood = require("../main.js");
Module._load = originalLoad;
const date = "2031-02-03";
const text = "A fictional writer feels calm and hopeful after a supportive conversation with friends.";
const valid = { moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2, valence: "positive", emotions: ["calm"], summary: "A fictional calm day.", drivers: ["Fictional support."], confidence: "low", confidenceReason: "Synthetic evidence." };
const tests = [];
function test(name, run) { tests.push({ name, run }); }
function fixture() {
  const p = new Mood();
  p.settings = { outputFolder: "Mood History", includeFolders: [], excludeFolders: [], enableGroq: true, autoAnalyze: true, minimumCharacters: 40, maxCharactersPerDay: 60000, model: "fictional" };
  p.records = {}; p.runtime = {}; p.groqBlockedUntil = 0;
  p.apiKey = () => "fictional";
  p.savePluginData = p.ensureFolder = async () => {};
  p.refreshRenderers = () => {};
  p.writeEntryNote = async () => {};
  p.resolveEntryPath = async record => record.entryPath || `Mood History/Entries/${record.date}.md`;
  const files = [new TFile("Journal/First.md"), new TFile("Private/Second.md")];
  p.app = { vault: { getMarkdownFiles: () => files, cachedRead: async () => text }, metadataCache: { getFileCache: () => ({}) } };
  return { p, files };
}

test("duplicate separators cannot bypass a folder exclusion", async () => {
  const { p } = fixture();
  await p.updateFolderFilter("excludeFolders", "Journal//Private/");
  assert.equal(p.getCreationDateForFile(new TFile("Journal/Private/Secret.md")), null);
});

test("scope changes during a read cancel before another read or provider call", async () => {
  const { p } = fixture();
  let reads = 0, requests = 0;
  p.app.vault.cachedRead = async () => { reads++; p.settings.excludeFolders = ["Private"]; return text; };
  p.analyzeWithGroq = async () => { requests++; throw new Error("Must not send stale scope"); };
  assert.equal(await p.analyzeDate(date), false);
  assert.equal(reads, 1);
  assert.equal(requests, 0);
  assert.deepEqual(p.records, {});
  assert.equal(p.runtime.lastGroqIssue, undefined);
});

test("rename into an excluded folder cancels gathered text", async () => {
  const { p, files } = fixture();
  p.settings.excludeFolders = ["Private"];
  p.app.vault.cachedRead = async () => { files[0].path = "Private/Moved.md"; return text; };
  let requests = 0;
  p.analyzeWithGroq = async () => { requests++; throw new Error("Must not send moved source"); };
  await p.analyzeDate(date);
  assert.equal(requests, 0);
});

for (const completionLimit of [false, true]) test(`Groq opt-out cancels ${completionLimit ? "completion" : "format"} retries`, async () => {
  const { p } = fixture();
  let requests = 0;
  p.requestGroq = async () => {
    requests++;
    p.settings.enableGroq = false;
    return { choices: [{ finish_reason: completionLimit ? "length" : "stop", message: { content: "invalid" } }] };
  };
  await p.analyzeDate(date);
  assert.equal(requests, 1);
  assert.equal(p.runtime.lastGroqIssue, undefined, "cancellation is not a provider failure");
  assert.deepEqual(p.records, {});
});

test("empty eligible date preserves saved history", async () => {
  const { p } = fixture();
  p.settings.enableGroq = false;
  p.app.vault.getMarkdownFiles = () => [];
  const prior = { date, status: "complete", contentHash: "old", sourcePaths: ["Journal/First.md"] };
  p.records[date] = prior;
  let writes = 0;
  p.writeEntryNote = async () => { writes++; };
  assert.equal(await p.analyzeDate(date), false);
  assert.equal(p.records[date], prior);
  assert.equal(writes, 0);
});

test("an eligible empty note still produces insufficient evidence", async () => {
  const { p } = fixture();
  p.settings.enableGroq = false;
  p.app.vault.cachedRead = async () => "";
  assert.equal(await p.analyzeDate(date), true);
  assert.equal(p.records[date].status, "insufficient");
});

test("queued background work respects automatic opt-out", async () => {
  const { p } = fixture();
  p.settings.autoAnalyze = false;
  let reads = 0;
  p.app.vault.cachedRead = async () => { reads++; return text; };
  await p.analyzeDate(date, { background: true });
  assert.equal(reads, 0);
});

for (const change of ["scope", "model", "unload", "rename"]) test(`in-flight ${change} change discards a successful stale result`, async () => {
  const { p, files } = fixture();
  let writes = 0;
  p.writeEntryNote = async () => { writes++; };
  p.analyzeWithGroq = async () => {
    if (change === "scope") p.settings.excludeFolders = ["Private"];
    if (change === "model") p.settings.model = "different-fictional-model";
    if (change === "unload") p.unloaded = true;
    if (change === "rename") files[0].path = "Elsewhere/Moved.md";
    return valid;
  };
  assert.equal(await p.analyzeDate(date), false);
  assert.equal(writes, 0);
  assert.deepEqual(p.records, {});
  assert.equal(p.runtime.lastGroqIssue, undefined);
});

test("rename while awaiting a provider reply prevents stale-text retries", async () => {
  const { p, files } = fixture();
  let requests = 0;
  p.requestGroq = async () => {
    requests++; files[0].path = "Elsewhere/Moved.md";
    return { choices: [{ message: { content: "invalid" } }] };
  };
  await p.analyzeDate(date);
  assert.equal(requests, 1);
});

test("a failed in-flight request after opt-out cannot restore provider error state", async () => {
  const { p } = fixture();
  let saves = 0;
  p.savePluginData = async () => { saves++; };
  p.requestGroq = async () => {
    p.settings.enableGroq = false;
    throw Object.assign(new Error("Synthetic rate limit"), { status: 429 });
  };
  await p.analyzeDate(date);
  assert.equal(saves, 3, "only pre-dispatch progress checkpoints are saved; opt-out cannot restore provider error state");
  assert.equal(p.runtime.lastGroqIssue, undefined);
  assert.equal(p.groqBlockedUntil, 0);
});

test("entry ownership is checked atomically at write time", async () => {
  const { p } = fixture();
  delete p.writeEntryNote;
  const path = `Mood History/Entries/${date}.md`;
  const file = new TFile(path);
  const owned = `---\ntype: "automatic-mood-entry"\nautomatic_mood_history: true\ndate: "${date}"\n---\nOld generated text`;
  const privateText = "A fictional user replaced the generated note during a sync.";
  let content = owned;
  p.app.vault.getAbstractFileByPath = () => file;
  p.app.vault.cachedRead = async () => owned;
  p.app.vault.modify = async (_file, value) => { content = value; };
  p.app.vault.process = async (_file, transform) => { content = privateText; content = transform(content); };
  await assert.rejects(p.writeEntryNote({ date, sourcePaths: [] }), /ownership/i);
  assert.equal(content, privateText);
});

test("owned updates and new entries still write successfully", async () => {
  const { p } = fixture(); delete p.writeEntryNote;
  const path = `Mood History/Entries/${date}.md`;
  const file = new TFile(path);
  let content = `---\ntype: "automatic-mood-entry"\nautomatic_mood_history: true\ndate: "${date}"\n---\nOld`;
  p.app.vault.getAbstractFileByPath = () => file;
  p.app.vault.cachedRead = async () => content;
  p.app.vault.process = async (_file, transform) => { content = transform(content); };
  const record = { date, ...valid, sourcePaths: [] };
  await p.writeEntryNote(record);
  assert(content.includes(require("../src/sentiment-core").plainNarrative(valid.summary)));
  assert.equal(record.entryPath, path);
  p.app.vault.getAbstractFileByPath = () => null;
  p.app.vault.create = async (createdPath, value) => { assert.equal(createdPath, path); content = value; };
  await p.writeEntryNote(record);
  assert(content.includes(require("../src/sentiment-core").plainNarrative(valid.summary)));
});

test("create collision preserves the competing note", async () => {
  const { p } = fixture(); delete p.writeEntryNote;
  p.app.vault.getAbstractFileByPath = () => null;
  let modified = false;
  p.app.vault.create = async () => { throw new Error("Already exists"); };
  p.app.vault.modify = async () => { modified = true; };
  await assert.rejects(p.writeEntryNote({ date, sourcePaths: [] }), /Already exists/);
  assert.equal(modified, false);
});

(async () => {
  let failures = 0;
  for (const { name, run } of tests) {
    try { await run(); console.log(`PASS ${name}`); }
    catch (error) { failures++; console.error(`FAIL ${name}: ${error.message}`); }
  }
  if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
