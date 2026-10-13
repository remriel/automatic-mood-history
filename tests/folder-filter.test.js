const assert = require("assert");
const Module = require("module");
class TFile {
  constructor(path, ctime) {
    this.path = path;
    this.extension = path.split(".").pop();
    this.stat = { ctime };
  }
}
class Plugin {}
class PluginSettingTab {}
class Component {}
class Notice {}
class Setting {}
class TFolder {}
const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "obsidian") return {
    TFile, TFolder, Plugin, PluginSettingTab, Component, Notice, Setting,
    requestUrl: async () => ({ status: 403, text: "mock" })
  };
  return originalLoad.call(this, request, parent, isMain);
};
const LoadedPlugin = require("../main.js");
const plugin = new LoadedPlugin();
const stamp = new Date(2031, 1, 3, 12).getTime();
const files = [
  new TFile("Journal/Day.md", stamp),
  new TFile("Journal/Private/Secret.md", stamp),
  new TFile("Journalism/Separate.md", stamp),
  new TFile("Work/Report.md", stamp),
  new TFile("Root.md", stamp),
  new TFile("Mood History/Entries/Day.md", stamp),
  new TFile(".trash/Old.md", stamp)
];
plugin.settings = { outputFolder: "Mood History", includeFolders: [], excludeFolders: [], maxCharactersPerDay: 60000 };
plugin.app = {
  vault: {
    getMarkdownFiles: () => files,
    getAbstractFileByPath: (path) => files.find((f) => f.path === path) || null,
    cachedRead: async (f) => f.path
  },
  metadataCache: { getFileCache: () => ({}) }
};
const date = "2031-02-03";
assert.deepStrictEqual(plugin.filesForDate(date).map((f) => f.path), files.slice(0, 5).map((f) => f.path));
plugin.settings.includeFolders = ["Journal"];
assert.deepStrictEqual(plugin.filesForDate(date).map((f) => f.path), ["Journal/Day.md", "Journal/Private/Secret.md"]);
assert.strictEqual(plugin.getCreationDateForFile(files[2]), null, "prefix collisions are excluded");
plugin.settings.excludeFolders = ["Journal/Private"];
assert.deepStrictEqual(plugin.filesForDate(date).map((f) => f.path), ["Journal/Day.md"]);
assert.strictEqual(plugin.getCreationDateForFile(files[1]), null);
assert.strictEqual(plugin.getCreationDateForFile(files[1], "Journal/Day.md"), date, "rename old path is respected");
assert.strictEqual(plugin.getCreationDateForFile(files[0], "Journal/Private/New.md"), null);
(async () => {
  const gathered = await plugin.gatherDate(date);
  assert.deepStrictEqual(gathered.sourcePaths, ["Journal/Day.md"]);
  assert(!gathered.analysisText.includes("Secret"), "excluded content is not read");
  plugin.records = { [date]: { date, dateBasis: "legacy-note-date", sourcePaths: ["Journal/Day.md", "Journal/Private/Secret.md"] } };
  assert.strictEqual(await plugin.gatherLegacyDate(date), null, "partial legacy source sets are skipped");
  plugin.settings.includeFolders = ["/"];
  plugin.settings.excludeFolders = [];
  assert.deepStrictEqual(plugin.filesForDate(date).map((f) => f.path), ["Root.md"]);
  plugin.settings.includeFolders = [];
  plugin.settings.excludeFolders = ["/"];
  assert(!plugin.filesForDate(date).some((f) => f.path === "Root.md"), "root exclusion works");
  let saved;
  plugin.savePluginData = async () => { saved = { ...plugin.settings }; };
  plugin.refreshRenderers = () => {};
  await plugin.updateFolderFilter("includeFolders", "Journal\\Private\nJournal/Notes\nJournal/Notes");
  assert.deepStrictEqual(saved.includeFolders, ["Journal/Private", "Journal/Notes"]);
  await plugin.updateFolderFilter("excludeFolders", "Journal/Private");
  assert.deepStrictEqual(saved.excludeFolders, ["Journal/Private"]);
  console.log("folder scope and provider-source filtering passed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
