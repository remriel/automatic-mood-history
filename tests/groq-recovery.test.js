const assert = require("assert");
const Module = require("module");
const { buildEntryMarkdown } = require("../src/sentiment-core");

const notices = [];
const requests = [];
let respond;
const valid = {
  moodScore: 4, energyScore: 3, connectionScore: 4, intensityScore: 2,
  valence: "positive", emotions: ["hopeful", "peaceful"],
  summary: "A fictional sample describes a calm and supportive conversation.",
  drivers: ["The fictional writer mentions support."], confidence: "medium",
  confidenceReason: "The fictional sample has clear but limited evidence."
};
const success = (analysis = valid) => ({ status: 200, json: { choices: [{ finish_reason: "stop", message: { content: JSON.stringify(analysis) } }] } });
const originalLoad = Module._load;
Module._load = function (request, parent, isMain) {
  if (request === "obsidian") return {
    Plugin: class {}, PluginSettingTab: class {}, Component: class {}, TFile: class {}, TFolder: class {}, Setting: class {},
    Notice: class { constructor(message) { notices.push(message); } },
    requestUrl: async (request) => {
      const payload = JSON.parse(request.body);
      requests.push(payload);
      return respond(payload);
    }
  };
  return originalLoad.call(this, request, parent, isMain);
};
const MoodPlugin = require("../main.js");
Module._load = originalLoad;
const savedKey = process.env.GROQ_API_KEY;
process.env.GROQ_API_KEY = "synthetic-test-placeholder";
const dates = ["2030-03-14", "2030-03-15"];

function fixture() {
  requests.length = notices.length = 0;
  respond = () => success();
  const plugin = new MoodPlugin();
  plugin.settings = { enableGroq: true, model: "openai/gpt-oss-20b", minimumCharacters: 40 };
  plugin.records = {};
  plugin.runtime = {};
  plugin.groqBlockedUntil = 0;
  plugin.lastGroqError = "";
  plugin.getAllDates = () => dates;
  plugin.gatherDate = async (date) => ({ date, analysisText: "A fictional writer feels calm, hopeful, and supported after a friendly conversation.", topic: "", contentHash: date, sourcePaths: [`Fictional/${date}.md`] });
  plugin.savePluginData = async () => {};
  plugin.writeEntryNote = async () => {};
  plugin.ensureSupportFiles = async () => {};
  plugin.refreshRenderers = () => {};
  return plugin;
}

async function run() {
  let plugin = fixture();
  respond = (payload) => {
    assert.strictEqual(payload.response_format.json_schema.schema.properties.emotions.uniqueItems, undefined);
    assert.strictEqual(payload.reasoning_effort, "low");
    assert.strictEqual(payload.include_reasoning, false);
    assert.strictEqual(payload.reasoning_format, undefined);
    assert.deepStrictEqual(payload.messages.map((message) => message.role), ["system", "user"]);
    return success({ ...valid, emotions: ["hopeful", "hopeful"] });
  };
  const result = await plugin.analyzeWithGroq(dates[0], "Synthetic sample.");
  assert.deepStrictEqual(result.emotions, ["hopeful"], "local validation deduplicates without an unsupported remote constraint");
  assert.strictEqual(requests.length, 1);

  plugin = fixture();
  respond = (payload) => requests.length === 1 ? { status: 200, json: { choices: [{ finish_reason: "length", message: { content: "", reasoning: "unfinished synthetic reasoning" } }] } } : success();
  await plugin.analyzeWithGroq(dates[0], "Synthetic sample.");
  assert.strictEqual(requests.length, 2);
  assert.strictEqual(requests[1].max_completion_tokens, 8192);
  assert.deepStrictEqual(requests[0].response_format, requests[1].response_format, "length recovery keeps strict output");

  plugin = fixture();
  respond = () => success({});
  await assert.rejects(plugin.analyzeWithGroq(dates[0], "Synthetic sample."), (error) => error.status === 422);
  assert.strictEqual(requests.length, 3, "partial objects do not turn into invented neutral scores");

  plugin = fixture();
  plugin.groqBlockedUntil = Date.now() + 600000;
  await assert.rejects(plugin.analyzeWithGroq(dates[0], "Synthetic sample."));
  assert.strictEqual(requests.length, 0);
  await plugin.analyzeWithGroq(dates[0], "Synthetic sample.", { forceGroq: true });
  assert.strictEqual(requests.length, 1, "explicit retry reaches the provider despite an old cooldown");

  plugin = fixture();
  plugin.groqBlockedUntil = Date.now() + 600000;
  respond = () => ({ status: 429, headers: { "Retry-After": "120" }, json: { error: { code: "rate_limit_exceeded", message: "PRIVATE_ACCOUNT_AND_NOTE_TEXT must never be saved" } } });
  const before = Date.now();
  const limited = await plugin.analyzeAll({ force: true, forceGroq: true });
  assert.strictEqual(requests.length, 1, "a new provider pause applies to the remaining dates of a forced run");
  assert.strictEqual(limited.fallback, 2);
  assert.strictEqual(limited.failures, 1);
  assert(plugin.groqBlockedUntil >= before + 120000 && plugin.groqBlockedUntil <= Date.now() + 120000);
  assert.strictEqual(plugin.runtime.lastGroqIssue.kind, "rate-limit");
  assert(!JSON.stringify(plugin.runtime).includes("PRIVATE_ACCOUNT"));
  assert(!JSON.stringify(plugin.records).includes("PRIVATE_ACCOUNT"));

  plugin = fixture();
  plugin.records = Object.fromEntries(dates.map((date) => [date, { ...valid, date, status: "complete", dateBasis: "created-at-local-date", analysisSource: "groq", contentHash: date }]));
  plugin.runtime.lastGroqIssue = { kind: "output", message: "Previous synthetic failure." };
  plugin.lastGroqError = "Previous synthetic failure.";
  const unchanged = await plugin.analyzeAll();
  assert.strictEqual(unchanged.updated, 0);
  assert.strictEqual(requests.length, 0);
  assert(!notices.at(-1).includes("failure") && !notices.at(-1).includes("unavailable"), "a no-op scan does not repeat a saved provider error");

  plugin = fixture();
  plugin.records[dates[0]] = { ...valid, date: dates[0], status: "complete", dateBasis: "created-at-local-date", analysisSource: "local-fallback", contentHash: dates[0] };
  await plugin.analyzeDate(dates[0]);
  assert.strictEqual(requests.length, 1, "unchanged fallback records are retried after a pause expires");
  assert.strictEqual(plugin.records[dates[0]].analysisSource, "groq");

  plugin = fixture();
  plugin.settings.enableGroq = false;
  await plugin.analyzeDate(dates[0]);
  assert.strictEqual(requests.length, 0);
  assert.strictEqual(plugin.records[dates[0]].analysisSource, "local");
  assert(!plugin.records[dates[0]].confidenceReason.includes("Groq"));
  assert(buildEntryMarkdown(plugin.records[dates[0]]).includes("Local scoring analyzed"));

  plugin = fixture();
  respond = () => ({ status: 503, get json() { throw new Error("not JSON"); }, text: "PRIVATE_RESPONSE_BODY" });
  await plugin.analyzeDate(dates[0]);
  assert.strictEqual(plugin.runtime.lastGroqIssue.kind, "service");
  assert(!JSON.stringify(plugin.runtime).includes("PRIVATE_RESPONSE_BODY"));

  plugin = fixture();
  const original = { ...valid, date: dates[0], status: "complete", dateBasis: "created-at-local-date", analysisSource: "groq", contentHash: dates[0] };
  plugin.records[dates[0]] = original;
  respond = () => ({ status: 503, json: {} });
  assert.strictEqual(await plugin.analyzeDate(dates[0], { force: true }), false);
  assert.strictEqual(plugin.records[dates[0]], original, "a failed retry preserves a valid unchanged Groq result");

  plugin = fixture();
  let inFlight = 0;
  let peak = 0;
  respond = async () => {
    inFlight += 1;
    peak = Math.max(peak, inFlight);
    await new Promise((resolve) => setTimeout(resolve, 10));
    inFlight -= 1;
    return success();
  };
  await Promise.all(dates.map((date) => plugin.analyzeDate(date)));
  assert.strictEqual(peak, 1, "independent note events cannot flood Groq in parallel");

  plugin = fixture();
  plugin.groqBlockedUntil = Date.now() + 600000;
  assert.strictEqual(await plugin.checkGroqConnection(), true);
  assert.strictEqual(requests.length, 1);
  assert(requests[0].messages[1].content.includes("fictional connection-check sample"));
  assert.deepStrictEqual(plugin.records, {}, "connection checks do not create or replace history");
  assert.strictEqual(plugin.groqBlockedUntil, 0);
  assert.strictEqual(plugin.runtime.lastGroqModel, plugin.settings.model);
  assert(plugin.groqStatus().text.includes("GROQ CONNECTED"));
  console.log("Groq schema, completion recovery, retry, cooldown, privacy, provenance, and concurrency regressions passed");
}

run().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => {
  if (savedKey === undefined) delete process.env.GROQ_API_KEY;
  else process.env.GROQ_API_KEY = savedKey;
});
