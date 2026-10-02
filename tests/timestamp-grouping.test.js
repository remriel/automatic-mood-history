const assert = require("assert");
const Module = require("module");

class TFile {
  constructor(path, ctime) {
    this.path = path;
    this.extension = path.split(".").pop();
    this.stat = { ctime, mtime: ctime, size: 0 };
  }
}
class Plugin {}
class PluginSettingTab {}
class Component {}
class Notice {}
class Setting {}

const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "obsidian") {
    return {
      Component, Notice, Plugin, PluginSettingTab, Setting, TFile,
      requestUrl: async () => ({ status: 403, json: { error: { message: "mock" } }, text: "mock" })
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const LoadedPlugin = require("../main.js");
const plugin = new LoadedPlugin();
const firstDayTimestamp = new Date(2031, 0, 2, 12, 0, 0).getTime();
const secondDayTimestamp = new Date(2031, 0, 3, 12, 0, 0).getTime();
const files = [
  new TFile("Daily/2099-12-31.md", firstDayTimestamp),
  new TFile("Projects/Untitled.md", firstDayTimestamp),
  new TFile("Meetings/Plan.md", firstDayTimestamp),
  new TFile("Projects/Next.md", secondDayTimestamp),
  new TFile("Mood History/Entries/2031-01-02.md", firstDayTimestamp),
  new TFile(".trash/Old note.md", firstDayTimestamp),
  new TFile("Attachments/photo.png", firstDayTimestamp),
  new TFile("Drafts/No timestamp.md", undefined)
];
const contents = new Map([
  ["Daily/2099-12-31.md", "A daily note created today."],
  ["Projects/Untitled.md", "An untitled project note created today."],
  ["Meetings/Plan.md", "A meeting note created today."],
  ["Projects/Next.md", "A note created the next day."]
]);
plugin.settings = { outputFolder: "Mood History", maxCharactersPerDay: 60000 };
plugin.app = {
  vault: {
    getMarkdownFiles: () => files,
    cachedRead: async (file) => contents.get(file.path) || ""
  },
  metadataCache: {
    getFileCache: () => ({ frontmatter: { date: "2040-04-05", aliases: ["2040-04-05"], topic: "synthetic" } })
  }
};

const firstDay = "2031-01-02";
const secondDay = "2031-01-03";
assert.strictEqual(plugin.getCreationDateForFile(files[0]), firstDay, "filename date does not override ctime");
assert.strictEqual(plugin.getCreationDateForFile(files[1]), firstDay, "a note in any folder is included");
assert.strictEqual(plugin.getCreationDateForFile(files[4]), null, "generated history is excluded");
assert.strictEqual(plugin.getCreationDateForFile(files[5]), null, "trash is excluded");
assert.strictEqual(plugin.getCreationDateForFile(files[6]), null, "non-Markdown files are excluded");
assert.strictEqual(plugin.getCreationDateForFile(files[7]), null, "files without a creation timestamp are skipped");
assert.strictEqual(plugin.getCreationDateForFile(files[0], "Mood History/Entries/renamed.md"), null);
assert.strictEqual(plugin.getCreationDateForFile(files[0], "Projects/renamed.md"), firstDay, "rename preserves the creation-date group");
assert.deepStrictEqual(plugin.getAllDates(), [firstDay, secondDay]);
assert.deepStrictEqual(plugin.filesForDate(firstDay).map((file) => file.path), [
  "Daily/2099-12-31.md",
  "Meetings/Plan.md",
  "Projects/Untitled.md"
]);

plugin.gatherDate(firstDay).then(async (gathered) => {
  assert.strictEqual(gathered.sourcePaths.length, 3, "all notes created that day are consolidated");
  assert(gathered.analysisText.includes("daily note created today"));
  assert(gathered.analysisText.includes("project note created today"));
  assert(gathered.analysisText.includes("meeting note created today"));

  const legacyRecord = {
    date: firstDay,
    dateBasis: "legacy-note-date",
    contentHash: gathered.contentHash,
    sourcePaths: gathered.sourcePaths,
    status: "complete",
    moodScore: 3,
    summary: "Preserved synthetic record."
  };
  plugin.records = { [firstDay]: legacyRecord };
  let saveCalls = 0;
  plugin.savePluginData = async () => { saveCalls += 1; };
  plugin.refreshRenderers = () => {};
  plugin.writeEntryNote = async () => { throw new Error("unchanged legacy analysis should not rewrite its note"); };

  const changed = await plugin.analyzeDate(firstDay);
  assert.strictEqual(changed, true, "matching legacy data is promoted to the timestamp scope");
  assert.strictEqual(legacyRecord.dateBasis, "created-at-local-date");
  assert.strictEqual(legacyRecord.summary, "Preserved synthetic record.");
  assert.strictEqual(saveCalls, 1);
  console.log("all Markdown notes are grouped by creation timestamp; legacy records are preserved");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
