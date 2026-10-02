const assert = require("assert");
const Module = require("module");

class Plugin {}
class PluginSettingTab {}
class Component {}
class TFile {}
class Notice {}
class Setting {}

let calls = 0;
const valid = {
  moodScore: 3,
  energyScore: 3,
  connectionScore: 4,
  intensityScore: 2,
  valence: "mixed",
  emotions: ["curious", "relieved"],
  summary: "A synthetic sample mentions a busy day and a helpful conversation.",
  drivers: ["The sample mentions a conversation."],
  confidence: "low",
  confidenceReason: "The synthetic sample contains limited sentiment detail."
};

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
      requestUrl: async (request) => {
        calls += 1;
        if (calls < 3) {
          return {
            status: 400,
            json: { error: { message: "Failed to validate JSON" } },
            text: "Failed to validate JSON"
          };
        }
        assert.strictEqual(request.response_format, undefined);
        return {
          status: 200,
          json: { choices: [{ message: { content: `Analysis follows:\n${JSON.stringify(valid)}` } }] },
          text: ""
        };
      }
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

process.env.GROQ_API_KEY = "test-only-placeholder";
const LoadedPlugin = require("../main.js");
const instance = new LoadedPlugin();
instance.settings = {
  model: "openai/gpt-oss-20b"
};
instance.groqBlockedUntil = 0;
instance.lastGroqError = "";

instance.analyzeWithGroq("2030-03-14", "The sample mentions a busy day and a helpful conversation.").then((result) => {
  assert.strictEqual(calls, 3);
  assert.strictEqual(result.moodScore, 3);
  assert.deepStrictEqual(result.emotions, ["curious", "relieved"]);
  console.log("Groq three-stage structured-output fallback passed");
}).catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
