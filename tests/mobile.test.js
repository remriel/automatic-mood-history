const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { TextEncoder, TextDecoder } = require("node:util");
const manifest = require("../manifest.json");

// Run the actual release bundle without process, Buffer, Node imports or disk APIs.
function fixture() {
  class TFile {
    constructor(path) {
      this.path = path;
      this.extension = path.split(".").pop();
      this.stat = { ctime: new Date(2031, 1, 3, 12).getTime(), mtime: 1, size: 80 };
    }
  }
  class TFolder {}
  const files = new Map(), text = new Map(), secrets = new Map(), timers = new Map();
  const document = new EventTarget(), window = new EventTarget();
  document.visibilityState = "visible";
  let timerId = 0, saved, layoutReady, requestError;
  const requests = [], notices = [], cleanups = [];
  window.setTimeout = window.setInterval = callback => { timers.set(++timerId, callback); return timerId; };
  window.clearTimeout = window.clearInterval = id => timers.delete(id);
  const context = vm.createContext({
    module: { exports: {} }, console, TextEncoder, TextDecoder, document, window,
    require: name => {
      assert.equal(name, "obsidian", "release bundle only imports Obsidian");
      return {
        Component: class {}, Plugin: class {}, PluginSettingTab: class {}, Setting: class {}, TFile, TFolder,
        Platform: { isMobileApp: true }, Notice: class { constructor(message) { notices.push(message); } },
        requestUrl: async options => {
          requests.push(options);
          if (requestError) throw requestError;
          return { status: 200, json: { choices: [{ message: { content: JSON.stringify({
            moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2,
            valence: "positive", emotions: ["joy"], summary: "A fictional calm afternoon.",
            drivers: ["Fictional support."], confidence: "medium", confidenceReason: "Fictional evidence."
          }) } }] } };
        }
      };
    }
  });
  vm.runInContext(fs.readFileSync(require.resolve("../main.js"), "utf8"), context);
  const p = new context.module.exports();
  const source = new TFile("Journal/Fictional.md");
  files.set(source.path, source);
  text.set(source.path, "I feel happy and grateful after a calm afternoon and a supportive conversation with friends.");
  p.manifest = manifest;
  p.loadData = async () => ({});
  p.saveData = async data => { saved = JSON.parse(JSON.stringify(data)); };
  for (const method of ["addRibbonIcon", "addCommand", "addSettingTab", "registerMarkdownCodeBlockProcessor", "registerEvent"]) p[method] = () => {};
  p.register = cleanup => cleanups.push(cleanup);
  p.registerDomEvent = (target, event, callback) => {
    target.addEventListener(event, callback);
    cleanups.push(() => target.removeEventListener(event, callback));
  };
  p.app = {
    secretStorage: { getSecret: id => secrets.get(id) || null, setSecret: (id, key) => secrets.set(id, key) },
    metadataCache: { getFileCache: () => ({}) },
    workspace: { onLayoutReady: callback => { layoutReady = callback; } },
    vault: {
      getMarkdownFiles: () => [...files.values()].filter(file => file instanceof TFile && file.extension === "md"),
      getAbstractFileByPath: path => files.get(path) || null,
      cachedRead: async file => text.get(file.path) || "",
      createFolder: async path => { files.set(path, new TFolder()); },
      create: async (path, content) => { const file = new TFile(path); files.set(path, file); text.set(path, content); return file; },
      process: async (file, transform) => { text.set(file.path, transform(text.get(file.path))); },
      on: () => ({}),
      adapter: { stat: async path => files.get(path) instanceof TFolder ? { type: "folder" } : null }
    }
  };
  return { p, context, document, window, timers, secrets, requests, notices, text, cleanups,
    get saved() { return saved; },
    ready: () => layoutReady(), failRequests: () => { requestError = new Error("Fictional network loss"); },
    flushResume: async () => {
      const timer = p.foregroundRecoveryTimer;
      const callback = timers.get(timer);
      timers.delete(timer);
      callback?.();
      await Promise.resolve(); await Promise.resolve();
    }
  };
}

async function run() {
  assert.equal(manifest.isDesktopOnly, false, "Android and iOS can enable the plugin");
  const f = fixture(), { p } = f;
  assert.equal(vm.runInContext("typeof process + '/' + typeof Buffer", f.context), "undefined/undefined");
  await p.onload(); await f.ready();
  assert.equal(p.settings.enableGroq, false);
  assert.equal(p.settings.autoAnalyze, false);
  const result = await p.analyzeAll({ silent: true });
  assert.equal(result.local, 1, "offline local analysis works without Node");
  const record = Object.values(p.records)[0];
  assert.equal(record.analysisSource, "local");
  assert.equal(record.contentHash.length, 64);
  assert(f.text.get(record.entryPath).includes("Fictional"), "generated entry uses the mobile vault adapter");
  assert.equal(f.requests.length, 0);

  assert.equal(p.setGroqKey(" fictional-mobile-key "), true);
  assert.equal(p.apiKey(), "fictional-mobile-key");
  assert.equal(p.settings.enableGroq, false, "saving a key never opts in");
  assert.equal(f.requests.length, 0, "saving a key sends no request");
  await p.savePluginData();
  assert(!JSON.stringify(f.saved).includes("fictional-mobile-key"), "key stays outside plugin data");
  assert.equal(f.secrets.get("automatic-mood-history-groq"), "fictional-mobile-key");
  f.context.process = { env: { GROQ_API_KEY: " fictional-desktop-key ", UNRELATED_SECRET: "do-not-read" } };
  p.settings.apiKeyEnvironmentVariable = "UNRELATED_SECRET";
  assert.equal(p.apiKey(), "fictional-desktop-key", "desktop key keeps precedence and fixed name");
  delete f.context.process;
  const guard = p.analysisGuard();
  assert.equal(p.setGroqKey("fictional-replacement"), true);
  assert.throws(guard, error => error.code === "analysis_cancelled", "key rotation cancels stale work");
  assert.equal(p.setGroqKey(""), true);
  assert.equal(p.apiKey(), "");
  const storage = p.app.secretStorage;
  delete p.app.secretStorage;
  assert.equal(p.setGroqKey("do-not-persist"), false, "older Obsidian fails gracefully");
  assert.equal(p.apiKey(), "");
  p.app.secretStorage = { getSecret: () => { throw new Error("Fictional locked storage"); }, setSecret: () => { throw new Error("Fictional storage failure"); } };
  assert.equal(p.apiKey(), "");
  assert.equal(p.setGroqKey("do-not-persist"), false);
  p.app.secretStorage = storage;
  p.setGroqKey("fictional-mobile-key");
  p.settings.enableGroq = true;
  assert.equal(await p.checkGroqConnection(), true);
  assert.equal(f.requests.length, 1);
  assert.equal(f.requests[0].headers.Authorization, "Bearer fictional-mobile-key");
  assert(f.requests[0].body.includes("fictional connection-check sample"));
  f.failRequests();
  assert.equal(await p.checkGroqConnection(), false);
  assert.equal(f.requests.length, 2, "lost connectivity is not retried as three output formats");
  assert.equal(p.runtime.lastGroqIssue.kind, "connection");
  assert(p.groqBlockedUntil > Date.now());

  // Resume events only schedule opted-in automatic work and coalesce into one run.
  let scans = 0;
  p.analyzeAll = async () => { scans++; };
  f.window.dispatchEvent(new Event("focus"));
  assert.equal(p.foregroundRecoveryTimer, undefined, "manual installs stay manual on resume");
  p.settings.autoAnalyze = true;
  p.clearGroqPause();
  f.document.visibilityState = "hidden";
  f.document.dispatchEvent(new Event("visibilitychange"));
  await p.runAutomaticRecovery();
  assert.equal(scans, 0, "mobile background does not start automatic analysis");
  assert.throws(p.analysisGuard({ background: true }), error => error.code === "analysis_cancelled");
  f.document.visibilityState = "visible";
  f.document.dispatchEvent(new Event("visibilitychange"));
  const first = p.foregroundRecoveryTimer;
  f.window.dispatchEvent(new Event("focus")); f.window.dispatchEvent(new Event("online"));
  assert(!f.timers.has(first), "repeated resume events cancel the previous timer");
  await f.flushResume();
  assert.equal(scans, 1);
  p.lastAutomaticReconcileAt = Date.now();
  f.document.visibilityState = "hidden";
  f.document.dispatchEvent(new Event("visibilitychange"));
  f.document.visibilityState = "visible";
  f.document.dispatchEvent(new Event("visibilitychange"));
  await f.flushResume();
  assert.equal(scans, 2, "a real foreground return reconciles interrupted scans before the five-minute timer");
  p.lastAutomaticReconcileAt = 0;
  p.groqBlockedUntil = Date.now() + 60000;
  f.window.dispatchEvent(new Event("online")); await f.flushResume();
  assert.equal(scans, 2, "resume respects provider backoff");
  p.clearGroqPause();
  f.window.dispatchEvent(new Event("focus"));
  p.settings.autoAnalyze = false;
  await f.flushResume();
  assert.equal(scans, 2, "opting out while resume is queued prevents analysis");
  p.settings.autoAnalyze = true;
  f.window.dispatchEvent(new Event("focus"));
  const pending = p.foregroundRecoveryTimer;
  p.onunload(); for (const cleanup of f.cleanups) cleanup();
  assert(!f.timers.has(pending), "unload clears the queued resume");
  f.window.dispatchEvent(new Event("focus"));
  assert.equal(f.timers.size, 0, "unload removes events and interval");
  assert(!JSON.stringify(f.saved).includes("fictional-mobile-key"));
  console.log("Mobile bundle, offline analysis, secret storage, desktop compatibility, network loss, resume/backoff/consent and unload passed");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
