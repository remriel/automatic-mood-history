const assert = require("node:assert/strict");
const { fixture, date, deferred, valid, TFile } = require("./reliability-fixture");
async function run() {
  let { p } = fixture(); await p.onload();
  let registrations = 0; p.registerSourceEvents = () => registrations++;
  p.onunload(); await p.layoutReady(); assert.equal(registrations, 0);

  for (const stage of ["source", "provider", "folder", "entry", "finalization", "sample"]) {
    const f = fixture(); p = f.p; const gate = deferred(); const entered = deferred();
    let writesAfterUnload = 0;
    const save = p.saveData;
    p.saveData = async value => { if (p.unloaded) writesAfterUnload++; await save(value); };
    const create = p.app.vault.create;
    p.app.vault.create = async (...args) => { if (p.unloaded) writesAfterUnload++; return create(...args); };
    let operation;
    if (stage === "source") p.app.vault.cachedRead = async () => { entered.resolve(); await gate.promise; return "Fictional calm and hopeful writing with a supportive friend."; };
    if (stage === "provider" || stage === "sample") p.analyzeWithGroq = async () => { entered.resolve(); await gate.promise; return valid; };
    if (stage === "folder") p.app.vault.adapter.stat = async () => { entered.resolve(); await gate.promise; return null; };
    if (stage === "entry") {
      p.app.vault.create = async (...args) => { entered.resolve(); await gate.promise; return create(...args); };
    }
    if (stage === "finalization") {
      p.getAllDates = () => []; p.ensureSupportFiles = async () => { entered.resolve(); await gate.promise; };
    }
    operation = stage === "sample" ? p.checkGroqConnection() : stage === "finalization" ? p.analyzeAll({ silent: true }) : p.analyzeDate(date);
    await entered.promise; p.onunload(); gate.resolve(); await operation;
    assert.equal(writesAfterUnload, 0, stage);
    assert.equal(p.checkingGroq || false, false, stage); assert.equal(p.activeScan || null, null, stage);
    if (stage === "entry") assert(p.runtime.pendingWrites[date], "already dispatched entry writes leave recoverable prepared results");
    console.log(`PASS unload during ${stage}`);
  }

  let f = fixture(); p = f.p; p.watchSettings(); const gate = deferred(), entered = deferred();
  p.analyzeWithGroq = async () => { entered.resolve(); await gate.promise; return valid; };
  const inFlight = p.analyzeDate(date); await entered.promise;
  p.settings.model = "away"; p.settings.model = "fictional"; gate.resolve();
  assert.equal(await inFlight, false); assert.deepEqual(p.records, {});

  f = fixture(); p = f.p; const request = deferred(), requested = deferred();
  p.analyzeWithGroq = async () => { p.providerCalls++; requested.resolve(); await request.promise; throw Object.assign(new Error("Synthetic pause"), { status: 429, retryAfterMilliseconds: 120000 }); };
  const analysis = p.analyzeDate(date); await requested.promise;
  const sample = p.checkGroqConnection(); request.resolve(); await analysis;
  assert.equal(await sample, false); assert.equal(p.providerCalls, 1); assert.equal(p.runtime.lastGroqIssue.kind, "rate-limit");

  f = fixture(); p = f.p; p.settings.analyzeOnStartup = true;
  await p.analyzeDate(date, { background: true }); assert.equal(p.providerCalls, 0, "startup-only does not authorize continuous work");
  await p.analyzeAll({ background: true, startup: true, silent: true }); assert.equal(p.providerCalls, 1);
  p.settings.enableGroq = false; p.records = {};
  const read = deferred(), reading = deferred(); p.app.vault.cachedRead = async () => { reading.resolve(); await read.promise; return "Fictional supportive calm writing."; };
  const scan = p.analyzeAll({ silent: true }); await reading.promise;
  p.settings.includeFolders = ["Other"]; read.resolve(); const stats = await scan;
  assert(stats.cancelled > 0); assert.equal(stats.updated, 0);

  f = fixture(); p = f.p; p.watchSettings(); const barrier = deferred(); p.analysisQueue = barrier.promise;
  const queued = p.analyzeDate(date); p.settings.enableGroq = false; p.settings.enableGroq = true;
  barrier.resolve(); assert.equal(await queued, false); assert.equal(p.providerCalls, 0);
  console.log("PASS away-and-back epochs, queued sample pause, startup-only policy and scan cancellation counts");
}
run().catch(error => { console.error(error); process.exitCode = 1; });
