const assert = require("assert");
const Module = require("module");

class Plugin {}
class PluginSettingTab {}
class Component {}
class TFile {}
class Notice {}
class Setting {}

const originalLoad = Module._load;
Module._load = function patched(request, parent, isMain) {
  if (request === "obsidian") {
    return {
      Component,
      Notice,
      Plugin,
      PluginSettingTab,
      Setting,
      TFile,
      requestUrl: async () => ({ status: 500, json: {}, text: "mock" })
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

const LoadedPlugin = require("../main.js");
assert.strictEqual(typeof LoadedPlugin, "function");
assert(LoadedPlugin.prototype instanceof Plugin);
console.log("bundled Obsidian plugin module loaded successfully");
