const assert = require("node:assert");
const Module = require("node:module");

// --- Part 1: text pipeline (no Obsidian dependency) -----------------------
const core = require("../src/sentiment-core");

assert.strictEqual(
  core.textForAnalysis("---\nI felt awful today.\n---\nThe end."),
  "I felt awful today. The end.",
  "a leading horizontal rule must not delete note text"
);
assert.strictEqual(
  core.textForAnalysis("---\ntitle: Daily note\ntags: [a]\n---\nReal text."),
  "Real text.",
  "real YAML frontmatter is still removed"
);
assert.strictEqual(
  core.textForAnalysis("Met [[Alice Chen]] and [[Project Falcon|the launch]] today."),
  "Met and the launch today.",
  "wikilink targets stay local while display aliases remain readable text"
);
assert.strictEqual(
  core.textForAnalysis("Mood: #private-journal and #health, issue #42, C# code."),
  "Mood: and, issue #42, C# code.",
  "inline tags are removed, but issue numbers and C# survive"
);
assert.strictEqual(
  core.textForAnalysis("![[Private Diagram]] visible"),
  "visible",
  "embeds are still removed"
);

// --- Part 2: transport failures are not model failures -------------------
let requests = 0;
const originalLoad = Module._load;
Module._load = function (request, ...args) {
  if (request === "obsidian") {
    return {
      Component: class {}, Notice: class {}, Plugin: class {}, PluginSettingTab: class {},
      Setting: class {}, TFile: class {}, TFolder: class {},
      requestUrl: async () => {
        requests += 1;
        throw new TypeError("net::ERR_INTERNET_DISCONNECTED");
      }
    };
  }
  return originalLoad.call(this, request, ...args);
};
process.env.GROQ_API_KEY = "test-only-placeholder";
const Plugin = require("../main.js");
Module._load = originalLoad;

(async () => {
  const plugin = new Plugin();
  plugin.settings = { enableGroq: true, model: "openai/gpt-oss-20b" };
  plugin.groqBlockedUntil = 0;
  plugin.lastGroqError = "";
  plugin.runtime = {};
  plugin.unloaded = false;

  let failure;
  try {
    await plugin.analyzeWithGroq("2031-02-03", "Fictional sample text about a tiring day.");
    throw new Error("expected analyzeWithGroq to reject");
  } catch (error) {
    failure = error;
  }
  assert.strictEqual(failure.code, "connection", "transport errors keep their own code");
  assert.strictEqual(failure.status, undefined, "transport errors must not be reported as HTTP 422");
  assert.strictEqual(requests, 1, "format retries must not multiply a failed connection attempt");

  const issue = plugin.recordGroqFailure(failure);
  assert.strictEqual(issue.kind, "connection");
  assert.match(issue.message, /could not be reached/i);
  assert(plugin.groqBlockedUntil > Date.now(), "a connection failure must pause the provider");

  console.log("review P1 regressions passed: frontmatter shape, wikilink/tag privacy, transport classification");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
