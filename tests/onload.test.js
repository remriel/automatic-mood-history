const assert = require("assert");
const Module = require("module");

class TFile {
  constructor(path = "") {
    this.path = path;
    this.extension = path.split(".").pop();
    this.basename = path.split("/").pop().replace(/\.md$/, "");
    this.parent = { path: path.split("/").slice(0, -1).join("/") };
  }
}
class TFolder {}
class Plugin {}
class PluginSettingTab {}
class Component {}
class Notice {}
class Setting {}

const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "obsidian") {
    return {
      Component, Notice, Plugin, PluginSettingTab, Setting, TFile, TFolder,
      requestUrl: async () => ({ status: 403, json: { error: { message: "mock" } }, text: "mock" })
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

global.window = globalThis;
const LoadedPlugin = require("../main.js");
const instance = new LoadedPlugin();
const existingFiles = new Map([
  ["Mood History", new TFolder()],
  ["Mood History/Mood History.md", new TFile("Mood History/Mood History.md")],
  ["Mood History/Mood History.base", new TFile("Mood History/Mood History.base")],
  ["Mood History/Methodology.md", new TFile("Mood History/Methodology.md")]
]);

let saved;
let layoutReadyCallback;
const createFolderCalls = [];
let saveCalls = 0;
const existingRecord = { date: "2099-01-02", status: "insufficient", sourceHash: "synthetic" };
instance.manifest = { version: require("../manifest.json").version };
instance.loadData = async () => ({
  settings: {
    dailyFolder: "Daily",
    includeOutsideDailyFolder: true,
    autoAnalyze: true,
    analyzeOnStartup: true,
    enableGroq: true
  },
  records: { "2099-01-02": existingRecord }
});
instance.saveData = async (data) => { saved = data; saveCalls += 1; };
instance.addRibbonIcon = () => {};
instance.addCommand = () => {};
instance.registerMarkdownCodeBlockProcessor = () => {};
instance.registerEvent = () => {};
instance.addSettingTab = () => {};
instance.register = (cleanup) => cleanup();
instance.app = {
  vault: {
    getAbstractFileByPath: (path) => {
      const abstractFile = existingFiles.get(path) || null;
      // Reproduce a startup cache that temporarily misses on-disk folders.
      return abstractFile instanceof TFolder ? null : abstractFile;
    },
    adapter: {
      stat: async (path) => {
        const abstractFile = existingFiles.get(path);
        if (!abstractFile) return null;
        return { type: abstractFile instanceof TFolder ? "folder" : "file" };
      }
    },
    createFolder: async (path) => {
      createFolderCalls.push(path);
      // Reproduce the observed Obsidian race: a folder appears between stat
      // and createFolder, so createFolder reports that it already exists.
      existingFiles.set(path, new TFolder());
      throw new Error("Folder already exists.");
    },
    create: async (path) => {
      const file = new TFile(path);
      existingFiles.set(path, file);
      return file;
    },
    modify: async () => {},
    cachedRead: async () => "",
    on: () => ({})
  },
  metadataCache: { getFileCache: () => ({}) },
  workspace: {
    getActiveFile: () => null,
    onLayoutReady: (callback) => { layoutReadyCallback = callback; }
  }
};

instance.onload().then(() => {
  assert(saved);
  assert.strictEqual(saveCalls, 1, "plugin data is saved before vault folder setup");
  assert.strictEqual(saved.runtime.lastLoadStatus, "loaded");
  assert.strictEqual(saved.runtime.version, instance.manifest.version);
  assert.strictEqual(saved.records["2099-01-02"], existingRecord, "existing history is preserved");
  assert.strictEqual(existingRecord.dateBasis, "legacy-note-date");
  assert.strictEqual(saved.settings.dailyFolder, undefined, "obsolete Daily-folder setting is removed");
  assert.strictEqual(saved.settings.includeOutsideDailyFolder, undefined, "obsolete folder-scope setting is removed");
  assert.strictEqual(saved.settings.autoAnalyze, true, "automatic note analysis preference is preserved");
  assert.strictEqual(saved.settings.analyzeOnStartup, true, "startup scan preference is preserved");
  assert.strictEqual(saved.settings.enableGroq, true, "Groq opt-in is preserved");
  assert.deepStrictEqual(createFolderCalls, [], "vault folders are not touched before layout is ready");
  return layoutReadyCallback();
}).then(() => {
  assert.deepStrictEqual(createFolderCalls, ["Mood History/Entries"]);
  assert.strictEqual(saveCalls, 2, "runtime state is persisted after support files initialize");
  assert.strictEqual(saved.runtime.lastLoadStatus, "loaded");
  console.log("plugin startup tolerates a duplicate-folder race in the Obsidian mock");
  // Layout-only startup/opening must not initiate analysis when preferences
  // are off, even when remote analysis itself is opted in.
  const manual = new LoadedPlugin();
  manual.manifest = instance.manifest;
  const complete = { date: "2099-02-03", dateBasis: "created-at-local-date", status: "complete", moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2, summary: "Fictional existing analysis", emotions: ["hopeful"], analysisSource: "groq", sourceHash: "fictional" };
  const snapshot = JSON.stringify(complete);
  manual.loadData = async () => ({ settings: { autoAnalyze: false, analyzeOnStartup: false, enableGroq: true }, records: { [complete.date]: complete } });
  manual.saveData = async () => {};
  for (const method of ["addRibbonIcon", "addCommand", "registerMarkdownCodeBlockProcessor", "registerEvent", "addSettingTab", "register"]) manual[method] = () => {};
  manual.app = instance.app;
  manual.app.workspace.getLeaf = () => ({ openFile: async () => {}, setViewState: async () => {} });
  manual.analyzeAll = manual.analyzeDate = async () => { throw new Error("Unexpected sentiment analysis during layout-only startup"); };
  return manual.onload().then(() => layoutReadyCallback()).then(() => manual.openDashboard()).then(() => {
    manual.handleSourceEvent(new TFile("Fictional source.md"));
    manual.refreshRenderers();
    assert.strictEqual(manual.debounceTimers.size, 0, "disabled automatic analysis does not queue work");
    assert.strictEqual(JSON.stringify(complete), snapshot, "layout-only startup and dashboard opening preserve existing records");
    console.log("manual-only startup, source events, and dashboard opening do not analyze or change records");
  });
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
