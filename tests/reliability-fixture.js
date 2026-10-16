const Module = require("node:module");
const { buildEntryMarkdown } = require("../src/sentiment-core");
class TFile {
  constructor(path, day = 3) {
    this.path = path; this.extension = path.split(".").pop();
    this.stat = { ctime: new Date(2031, 1, day, 12).getTime() };
  }
}
class TFolder {}
const notices = [];
const original = Module._load;
Module._load = function (name, ...args) {
  if (name === "obsidian") return { Plugin: class {}, PluginSettingTab: class {}, Component: class {}, Setting: class {}, TFile, TFolder, Notice: class { constructor(text) { notices.push(text); } } };
  return original.call(this, name, ...args);
};
const Mood = require("../main.js");
Module._load = original;
global.window = globalThis;
const date = "2031-02-03";
const valid = { moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2, valence: "positive", emotions: ["calm"], summary: "Fictional new result.", drivers: ["Fictional support."], confidence: "medium", confidenceReason: "Fictional evidence." };
const clone = value => JSON.parse(JSON.stringify(value));
function deferred() { let resolve, reject; const promise = new Promise((yes, no) => { resolve = yes; reject = no; }); return { promise, resolve, reject }; }
function fixture(disk = { json: null, files: new Map() }) {
  const p = new Mood();
  p.settings = { outputFolder: "Mood History", includeFolders: [], excludeFolders: [], enableGroq: true, autoAnalyze: false, analyzeOnStartup: false, model: "fictional", minimumCharacters: 40, maxCharactersPerDay: 60000, debounceMilliseconds: 5000 };
  p.records = {}; p.runtime = {}; p.renderContainers = new Set(); p.debounceTimers = new Map(); p.chartObservers = new Map();
  p.manifest = { version: "1.2.8" }; p.groqBlockedUntil = 0; p.analysisQueue = Promise.resolve();
  const files = new Map();
  const source = new TFile("Journal/Fictional.md"); files.set(source.path, source);
  for (const [path] of disk.files) files.set(path, new TFile(path));
  p.app = { vault: {
    getMarkdownFiles: () => Array.from(files.values()).filter(file => file instanceof TFile),
    getAbstractFileByPath: path => files.get(path) || null,
    cachedRead: async file => disk.files.get(file.path) ?? "I feel calm and hopeful after a conversation with friends. This is a fictional fixture.",
    create: async (path, text) => { if (files.has(path)) throw new Error("Already exists"); const file = new TFile(path); files.set(path, file); disk.files.set(path, text); return file; },
    process: async (file, transform) => { disk.files.set(file.path, transform(disk.files.get(file.path))); },
    createFolder: async path => { files.set(path, new TFolder()); },
    adapter: { stat: async path => files.get(path) instanceof TFolder ? { type: "folder" } : null },
    on: () => ({})
  }, metadataCache: { getFileCache: () => ({}) }, workspace: { onLayoutReady: callback => { p.layoutReady = callback; }, getActiveFile: () => source } };
  p.saveData = async snapshot => { disk.json = clone(snapshot); };
  p.loadData = async () => clone(disk.json);
  p.apiKey = () => "fictional"; p.providerCalls = 0;
  p.analyzeWithGroq = async (_date, text, options = {}) => { p.providerCalls++; return options.chunk ? require('../src/analysis-pipeline').localChunkAnalysis(options.chunk) : clone(valid); };
  p.refreshRenderers = () => {};
  p.addRibbonIcon = p.addCommand = p.addSettingTab = p.registerMarkdownCodeBlockProcessor = p.registerEvent = p.register = () => {};
  return { p, disk, files, source };
}
function priorRecord() { return { ...valid, date, status: "complete", dateBasis: "created-at-local-date", analysisSource: "groq", model: "fictional", contentHash: "old", summary: "Fictional old result.", sourcePaths: ["Journal/Fictional.md"], entryPath: `Mood History/Entries/${date}.md` }; }
module.exports = { Mood, TFile, TFolder, notices, fixture, date, valid, clone, deferred, priorRecord, buildEntryMarkdown };
