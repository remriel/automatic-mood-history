const assert = require("assert");
const Module = require("module");
class TFile {}
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "obsidian") return { Plugin: class {}, PluginSettingTab: class {}, TFile };
  return originalLoad.call(this, request, parent, isMain);
};
const Plugin = require("../main.js");
Module._load = originalLoad;

(async () => {
  const plugin = new Plugin();
  plugin.settings = { outputFolder: "Mood History" };
  const file = new TFile();
  const original = '---\ntype: "mood-history-dashboard"\n---\n\nA custom introduction.\n\n![[Mood History/Mood History.base]]\n\nKeep this closing paragraph.\n';
  let content = original;
  let processes = 0;
  plugin.app = { vault: {
    getAbstractFileByPath: () => file,
    cachedRead: async () => content,
    process: async (_file, callback) => { processes += 1; content = callback(content); }
  } };
  await plugin.upgradeDashboardLayout();
  assert(!content.includes("![["), "the wide Base is no longer embedded");
  assert(content.includes("[[Mood History/Mood History.base|Open the optional Base table]]"));
  assert(content.startsWith(original.split("![[")[0]), "introduction and metadata are preserved");
  assert(content.endsWith("Keep this closing paragraph.\n"), "other writing is preserved");
  await plugin.upgradeDashboardLayout();
  assert.strictEqual(processes, 1, "migration is idempotent");
  content = "An unrelated note.\n![[Mood History/Mood History.base]]\n";
  await plugin.upgradeDashboardLayout();
  assert.strictEqual(processes, 1, "unowned notes are not rewritten");
  content = original;
  plugin.app.vault.process = async (_file, callback) => {
    content = "Concurrent edit without the ownership marker.\n![[Mood History/Mood History.base]]\n";
    const unchanged = content;
    content = callback(content);
    assert.strictEqual(content, unchanged, "ownership is rechecked during atomic processing");
  };
  await plugin.upgradeDashboardLayout();
  console.log("dashboard migration preserves other writing and only replaces the owned Base embed");
})().catch((error) => { console.error(error); process.exitCode = 1; });
