const assert = require("node:assert/strict");
const { fixture, date, valid, buildEntryMarkdown } = require("./reliability-fixture");
const { morningPagesSentiment } = require("../src/morning-pages-fallback");
const { analyzeWriting } = require("../src/vendor/morning-pages-analysis");
const { Element } = require("./dashboard-dom-fixture");

async function run() {
  const text = "I am happy happy joyful and love my friend. My work project and family make me proud.";
  const morningPages = analyzeWriting(text, {}, {});
  assert.equal(morningPages.feelings.joy, 3);
  assert.equal(morningPages.feelings.love, 1);
  assert.equal(morningPages.feelings.pride, 1);
  assert.equal(morningPages.topics.people, 2);
  assert.equal(morningPages.topics.work, 2);
  const expected = morningPagesSentiment(text);
  assert.equal(expected.moodScore, 10);
  assert(expected.emotions.includes("joy") && expected.emotions.includes("affection"));
  assert(expected.drivers.some(line => line.includes("work & learning")));
  assert.equal(morningPagesSentiment("I am anxious sad angry and afraid.").moodScore, 1);
  const positiveSteps = ["I am writing.", "I am happy.", "I am happy and proud.", "I am happy and proud and full of joy."];
  assert.equal(new Set(positiveSteps.map(sample => morningPagesSentiment(sample).moodScore)).size, positiveSteps.length,
    "different strengths produce distinct scores on the new scale");
  assert.deepEqual(morningPagesSentiment("A sentence with no matching category terms.").emotions, []);

  let f = fixture(); f.p.settings.enableGroq = false; f.disk.files.set(f.source.path, text);
  assert.equal(await f.p.analyzeDate(date), true);
  const offline = f.p.records[date];
  assert.equal(f.p.providerCalls, 0);
  assert.equal(offline.analysisSource, "morning-pages-fallback");
  assert.equal(offline.moodScore, expected.moodScore);
  assert.deepEqual(offline.emotions, expected.emotions);
  assert.equal(f.disk.json.records[date].analysisSource, "morning-pages-fallback");
  assert(buildEntryMarkdown(offline).includes("Morning Pages fallback analyzed"));
  assert.equal(f.p.runtime.pendingDates?.[date], undefined);

  // Changing analyzers must not rewrite existing scores for unchanged text.
  f = fixture(); f.disk.files.set(f.source.path, text);
  assert.equal(await f.p.analyzeDate(date), true);
  const groqRecord = f.p.records[date];
  const groqEntry = f.disk.files.get(groqRecord.entryPath);
  f.p.settings.enableGroq = false;
  assert.equal(await f.p.analyzeDate(date), false, "disabling Groq preserves an unchanged Groq result");
  assert.strictEqual(f.p.records[date], groqRecord);
  assert.equal(f.disk.files.get(groqRecord.entryPath), groqEntry, "the generated entry is not rewritten");
  f.p.records[date] = { ...groqRecord, analysisSource: "local", analysisFingerprint: "previous-local-analyzer" };
  const oldLocalRecord = f.p.records[date];
  assert.equal(await f.p.analyzeDate(date), false, "upgrading the local analyzer preserves an unchanged old score");
  assert.strictEqual(f.p.records[date], oldLocalRecord);
  f.disk.files.set(f.source.path, `${text} I also feel sad about a recent setback.`);
  assert.equal(await f.p.analyzeDate(date), true, "an actual source edit uses the new fallback");
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");

  f = fixture(); f.p.settings.minimumCharacters = 1000;
  f.disk.files.set(f.source.path, text);
  await f.p.analyzeDate(date);
  assert.equal(f.p.records[date].status, "insufficient");
  f.p.settings.minimumCharacters = 40;
  assert.equal(await f.p.analyzeDate(date), true, "lowering the threshold also rechecks writing with Groq enabled");
  assert.equal(f.p.records[date].analysisSource, "groq");
  assert.equal(f.p.providerCalls, 1);

  // Saved local scores are not upgraded during background reconciliation.
  // An explicit retry still preserves them when the provider is unavailable.
  for (const source of ["local", "local-fallback", "morning-pages-fallback"]) {
    f = fixture(); f.p.settings.autoAnalyze = true; f.disk.files.set(f.source.path, text);
    await f.p.analyzeDate(date);
    const saved = { ...f.p.records[date], analysisSource: source, moodScore: 2 };
    f.p.records[date] = saved;
    const entry = f.disk.files.get(saved.entryPath);
    f.p.analyzeWithGroq = async () => { throw Object.assign(new Error("unavailable"), { status: 503 }); };
    assert.equal(await f.p.analyzeDate(date, { background: true }), false, source);
    assert.equal(f.p.runtime.pendingDates?.[date], undefined, "unchanged saved scores do not enter the retry queue");
    assert.equal(await f.p.analyzeDate(date, { force: true }), false, source);
    assert.strictEqual(f.p.records[date], saved, `${source} keeps the unchanged saved score`);
    assert.equal(f.disk.files.get(saved.entryPath), entry);
    assert(f.disk.json.runtime.pendingDates[date], "the failed retry remains pending");
  }

  f = fixture(); f.disk.files.set(f.source.path, text);
  f.p.analyzeWithGroq = async () => { throw Object.assign(new Error("unavailable"), { status: 503 }); };
  await f.p.analyzeDate(date);
  const failedFallback = f.p.records[date];
  const fallbackEntry = f.disk.files.get(failedFallback.entryPath);
  f.p.settings.enableGroq = false;
  assert.equal(await f.p.analyzeDate(date), false, "disabling Groq preserves its unchanged fallback result");
  assert.strictEqual(f.p.records[date], failedFallback);
  assert.equal(f.disk.files.get(failedFallback.entryPath), fallbackEntry);
  f.p.settings.minimumCharacters += 1;
  assert.equal(await f.p.analyzeDate(date), true, "a later local setting change still refreshes the fallback");

  f = fixture(); f.p.settings.enableGroq = false; f.disk.files.set(f.source.path, text);
  await f.p.analyzeDate(date);
  f.p.settings.minimumCharacters += 1;
  assert.equal(await f.p.analyzeDate(date), true, "the current fallback still reacts to analysis setting changes");
  f = fixture(); f.p.settings.enableGroq = false; f.p.settings.minimumCharacters = 1000;
  f.disk.files.set(f.source.path, text);
  await f.p.analyzeDate(date);
  assert.equal(f.p.records[date].status, "insufficient");
  f.p.settings.minimumCharacters = 40;
  assert.equal(await f.p.analyzeDate(date), true, "lowering the threshold rechecks previously insufficient writing");
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");

  f = fixture(); f.p.settings.autoAnalyze = true; f.disk.files.set(f.source.path, text);
  let attempts = 0;
  f.p.analyzeWithGroq = async () => { attempts++; throw Object.assign(new Error("private provider data"), { status: 503 }); };
  assert.equal(await f.p.analyzeDate(date), true);
  assert.equal(attempts, 1);
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");
  assert.equal(f.p.records[date].moodScore, expected.moodScore);
  assert(f.disk.json.runtime.pendingDates[date], "provider retry survives the journaled commit");
  assert(!JSON.stringify(f.disk.json).includes("private provider data"));
  const retryAt = f.p.runtime.pendingDates[date].retryAt;
  f.disk.files.set(f.source.path, "I am sad and anxious, my friend left, and my work deadline is worrying me today.");
  assert.equal(await f.p.analyzeDate(date, { background: true }), true, "a changed note is rescored while Groq is paused");
  assert.equal(attempts, 1, "background edits do not bypass provider backoff");
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");
  assert(f.p.records[date].moodScore < 5);
  assert.equal(f.p.runtime.pendingDates[date].retryAt, retryAt, "edits do not extend provider backoff");
  f.disk.files.set(f.source.path, "I feel happy and proud about my friend and the work project we finished today.");
  f.p.lastAutomaticReconcileAt = 0;
  await f.p.runAutomaticRecovery();
  assert.equal(attempts, 1, "periodic reconciliation respects the Groq pause");
  assert(f.p.records[date].emotions.includes("joy"), "periodic recovery scores a missed edit during the provider pause");

  const restarted = fixture(f.disk).p;
  await restarted.onload();
  assert.equal(restarted.records[date].analysisSource, "morning-pages-fallback");
  restarted.groqBlockedUntil = 0;
  restarted.runtime.pendingDates[date].retryAt = new Date(0).toISOString();
  restarted.lastAutomaticReconcileAt = Date.now();
  await restarted.runAutomaticRecovery();
  assert.equal(restarted.providerCalls, 1, "minute recovery retries Groq without another edit");
  assert.equal(restarted.records[date].analysisSource, "groq");
  assert.equal(restarted.runtime.pendingDates[date], undefined);
  assert.equal(f.disk.json.runtime.pendingDates[date], undefined);

  f = fixture(); f.p.settings.autoAnalyze = true; f.disk.files.set(f.source.path, text);
  f.p.analyzeWithGroq = async () => { throw Object.assign(new Error("service unavailable"), { status: 503 }); };
  await f.p.analyzeDate(date);
  await f.p.updateSetting("enableGroq", false);
  assert.equal(f.p.runtime.pendingDates[date], undefined, "turning Groq off clears provider retries");
  f.disk.files.set(f.source.path, "I feel sad about work, a worrying deadline, and the friend I will not see today.");
  assert.equal(await f.p.analyzeDate(date, { background: true }), true);
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");
  f.p.groqBlockedUntil = Date.now() + 60000;
  f.p.lastAutomaticReconcileAt = 0;
  f.disk.files.set(f.source.path, "I feel happy and proud about the work project and my friend this morning.");
  await f.p.runAutomaticRecovery();
  assert(f.p.records[date].emotions.includes("joy"), "a stale provider pause cannot block local recovery when Groq is off");

  f = fixture(); f.p.apiKey = () => ""; f.disk.files.set(f.source.path, text);
  f.p.analyzeWithGroq = async () => { throw Object.assign(new Error("missing"), { code: "missing_key" }); };
  assert.equal(await f.p.analyzeDate(date), true);
  assert.equal(f.p.records[date].analysisSource, "morning-pages-fallback");
  assert.equal(f.p.runtime.pendingDates[date].kind, "configuration");

  // Run the same recovery pass used by the minute timer, with the actual
  // dashboard renderer attached and the provider replaced by a local stub.
  f = fixture(); f.p.settings.autoAnalyze = true; f.disk.files.set(f.source.path, text);
  f.p.analyzeWithGroq = async () => ({ ...valid, moodScore: ++f.p.providerCalls === 1 ? 2 : 5 });
  const root = new Element(); root.rootConnected = true;
  f.p.renderContainers.add(root); delete f.p.refreshRenderers;
  f.p.renderDashboard(root);
  assert(root.textContent.includes("No history yet"));
  await f.p.runAutomaticRecovery();
  assert.equal(f.p.providerCalls, 1);
  const scoreCard = () => root.walk().find(el => el.classList.contains("auto-mood-card-value"));
  const moodCard = () => root.walk().filter(el => el.classList.contains("auto-mood-card-value"))[1];
  assert.equal(scoreCard().textContent, "1", "recovery redraws the open dashboard without a manual reload");
  assert.equal(moodCard().textContent, "2.0");
  f.disk.files.set(f.source.path, "I feel happy and proud about my friend and the new project we completed today.");
  f.p.lastAutomaticReconcileAt = 0;
  await f.p.runAutomaticRecovery();
  assert.equal(f.p.providerCalls, 2, "the recovery scan catches a missed source edit");
  assert.equal(scoreCard().textContent, "1");
  assert.equal(moodCard().textContent, "5.0", "the recovery redraw reflects the new result");
  console.log("PASS Morning Pages word lists, offline/failure fallback, durable backoff, edited notes and automatic recovery");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
