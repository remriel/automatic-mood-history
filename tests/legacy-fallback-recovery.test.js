const assert = require("assert");
const Module = require("module");
const { buildEntryMarkdown } = require("../src/sentiment-core");
class TFile {
  constructor(path) { this.path = path; this.extension = "md"; this.stat = { ctime: new Date(2035, 2, 14, 12).getTime() }; }
}
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "obsidian") return { Plugin: class {}, PluginSettingTab: class {}, TFile, Notice: class {} };
  return originalLoad.call(this, request, parent, isMain);
};
const MoodPlugin = require("../main.js");
Module._load = originalLoad;
const legacyDate = "2030-03-14";
const secondDate = "2030-03-15";
const currentDate = "2035-03-14";
const originalText = "A fictional writer feels calm and hopeful after a supportive conversation.";
const otherText = "A different fictional note reports curiosity about a new project and several small achievements.";
const valid = { moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2, valence: "positive", emotions: ["hopeful"], summary: "Fictional Groq result.", drivers: ["Fictional support."], confidence: "medium", confidenceReason: "Fictional evidence." };

async function fixture() {
  const plugin = new MoodPlugin();
  const files = [new TFile(`Daily/${legacyDate}.md`), new TFile(`Projects/${secondDate}.md`), new TFile("Mood History/Entries/generated.md")];
  const contents = new Map([[files[0].path, originalText], [files[1].path, otherText], [files[2].path, "Never analyze generated history"]]);
  plugin.settings = { outputFolder: "Mood History", enableGroq: true, model: "fictional-model", minimumCharacters: 40, maxCharactersPerDay: 60000 };
  plugin.runtime = {}; plugin.records = {}; plugin.groqBlockedUntil = 0;
  plugin.apiKey = () => "synthetic-fixture-placeholder";
  plugin.app = { vault: { getMarkdownFiles: () => files, getAbstractFileByPath: path => files.find(file => file.path === path) || null, cachedRead: async file => contents.get(file.path) || "" }, metadataCache: { getFileCache: () => ({}) } };
  const writes = []; const calls = [];
  plugin.writeEntryNote = async record => writes.push(buildEntryMarkdown(record));
  plugin.savePluginData = plugin.ensureSupportFiles = async () => {};
  plugin.refreshRenderers = () => {};
  plugin.analyzeWithGroq = async (date, text) => { calls.push({ date, text }); return { ...valid }; };
  const legacy = { ...valid, date: legacyDate, status: "complete", analysisSource: "local-fallback", dateBasis: "legacy-note-date", sourcePaths: [files[0].path], contentHash: "old-hash", entryPath: `Mood History/Entries/${legacyDate} (Automatic Mood History).md` };
  const gathered = await plugin.gatherDate(currentDate);
  const current = { ...valid, date: currentDate, status: "complete", analysisSource: "groq", dateBasis: "created-at-local-date", sourcePaths: gathered.sourcePaths, contentHash: gathered.contentHash };
  plugin.records = { [legacyDate]: legacy, [currentDate]: current };
  return { plugin, files, contents, writes, calls, legacy, current };
}

(async () => {
  let f = await fixture();
  assert.deepStrictEqual(f.plugin.getAllDates(), [currentDate], "legacy note dates are absent from creation-date discovery");
  const result = await f.plugin.analyzeAll();
  assert.strictEqual(result.updated, 1);
  assert.strictEqual(result.pendingFallbacks, 0);
  assert.deepStrictEqual(f.calls, [{ date: legacyDate, text: originalText }], "Analyze changed reaches legacy fallback using only its saved sources");
  const recovered = f.plugin.records[legacyDate];
  assert.strictEqual(recovered.analysisSource, "groq");
  assert.strictEqual(recovered.dateBasis, "legacy-note-date", "recovery does not pretend the legacy date is a creation timestamp");
  assert.deepStrictEqual(recovered.sourcePaths, f.legacy.sourcePaths);
  assert.strictEqual(recovered.entryPath, f.legacy.entryPath, "conflict-safe stored entry path survives recovery");
  assert(f.writes[0].includes('analysis_source: "groq"'), "the entry Markdown is rewritten with real Groq provenance");
  assert.strictEqual(f.plugin.records[currentDate], f.current, "successful unchanged Groq results are not rerun");
  assert.strictEqual(f.contents.get(f.files[0].path), originalText, "source writing is never changed");

  f = await fixture();
  f.plugin.records[secondDate] = { ...f.legacy, date: secondDate, sourcePaths: [f.files[1].path] };
  f.plugin.groqBlockedUntil = Date.now() + 600000;
  const focused = await f.plugin.recoverFallbacksWithGroq();
  assert.strictEqual(focused.groq, 2);
  assert.strictEqual(f.calls.length, 2, "focused recovery clears an old pause once and retries only fallback entries");
  assert.strictEqual(f.plugin.records[currentDate], f.current);

  f = await fixture();
  const second = { ...f.legacy, date: secondDate, sourcePaths: [f.files[1].path] };
  f.plugin.records[secondDate] = second;
  f.plugin.analyzeWithGroq = async () => { f.calls.push("limited"); const error = new Error("Synthetic rate limit"); error.status = 429; error.retryAfterMilliseconds = 120000; throw error; };
  const limited = await f.plugin.recoverFallbacksWithGroq();
  assert.strictEqual(f.calls.length, 1, "a new rate limit prevents hammering the remaining entries");
  assert.strictEqual(limited.pendingFallbacks, 2);
  assert.strictEqual(f.plugin.records[legacyDate], f.legacy, "failed recovery preserves original fallback results");
  assert.strictEqual(f.plugin.records[secondDate], second);
  assert.strictEqual(f.writes.length, 0);

  for (const paths of [[f.files[0].path, "Missing/source.md"], ["Mood History/Entries/generated.md"]]) {
    f = await fixture(); f.legacy.sourcePaths = paths;
    const unavailable = await f.plugin.recoverFallbacksWithGroq();
    assert.strictEqual(unavailable.skipped, 1);
    assert.strictEqual(f.calls.length, 0, "missing, partial, or generated sources are never substituted");
    assert.strictEqual(f.plugin.records[legacyDate], f.legacy);
  }
  f = await fixture(); f.contents.set(f.files[0].path, "");
  await f.plugin.recoverFallbacksWithGroq();
  assert.strictEqual(f.plugin.records[legacyDate], f.legacy, "empty source text does not erase a historical score");
  assert.strictEqual(f.calls.length, 0);
  f = await fixture(); f.plugin.settings.enableGroq = false;
  await f.plugin.recoverFallbacksWithGroq();
  assert.strictEqual(f.calls.length, 0, "recovery respects opt-in");
  f.plugin.settings.enableGroq = true; f.plugin.apiKey = () => "";
  await f.plugin.recoverFallbacksWithGroq();
  assert.strictEqual(f.calls.length, 0, "missing key does not relabel or overwrite history");
  f = await fixture(); f.plugin.runtime.lastGroqSuccessAt = "2035-03-14T12:00:00Z"; f.plugin.runtime.lastGroqModel = "fictional-model";
  assert(f.plugin.groqStatus().text.includes("1 saved fallback entries"), "connected status distinguishes availability from pending history");
  console.log("legacy fallback recovery: saved source scoping, focused retries, entry provenance, existing results, consent, missing text, and rate-limit preservation passed");
})().catch(error => { console.error(error); process.exitCode = 1; });
