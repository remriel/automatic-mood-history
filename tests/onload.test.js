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

global.window = globalThis;
const LoadedPlugin = require("../main.js");
const instance = new LoadedPlugin();
const existingFiles = new Map([
  ["Mood History", {}],
  ["Mood History/Entries", {}],
  ["Mood History/Mood History.md", new TFile("Mood History/Mood History.md")],
  ["Mood History/Mood History.base", new TFile("Mood History/Mood History.base")],
  ["Mood History/Methodology.md", new TFile("Mood History/Methodology.md")]
]);

let saved;
instance.manifest = { version: "1.1.1" };
instance.loadData = async () => ({ settings: {}, records: {} });
instance.saveData = async (data) => { saved = data; };
instance.addRibbonIcon = () => {};
instance.addCommand = () => {};
instance.registerMarkdownCodeBlockProcessor = () => {};
instance.registerEvent = () => {};
instance.addSettingTab = () => {};
instance.register = (cleanup) => cleanup();
instance.app = {
  vault: {
    getAbstractFileByPath: (path) => existingFiles.get(path) || null,
    createFolder: async (path) => existingFiles.set(path, {}),
    create: async (path) => {
      const file = new TFile(path);
      existingFiles.set(path, file);
      return file;
    },
    modify: async () => {},
    on: () => ({})
  },
  metadataCache: { getFileCache: () => ({}) },
  workspace: {
    getActiveFile: () => null,
    onLayoutReady: (callback) => callback()
  }
};

instance.onload().then(() => {
  assert(saved);
  assert.strictEqual(saved.runtime.lastLoadStatus, "loaded");
  assert.strictEqual(saved.runtime.version, "1.1.1");
  console.log("bundled plugin onload completed in the Obsidian mock");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
