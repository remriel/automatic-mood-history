const assert = require('node:assert/strict');
const { fixture, date, clone, TFile, priorRecord, buildEntryMarkdown } = require('./reliability-fixture');

async function historicalFixture() {
  const f = fixture();
  const old = { ...priorRecord(), dateBasis: 'created-at-local-date' };
  f.p.records[date] = old;
  f.disk.files.set(old.entryPath, buildEntryMarkdown(old));
  f.files.set(old.entryPath, new TFile(old.entryPath));
  await f.p.savePluginData();
  return { ...f, old };
}

async function run() {
  // Same-day collision, a split into two days, and no score copying.
  const f = await historicalFixture();
  const { p, files, disk, old } = f;
  const oldJSON = clone(old), oldMarkdown = disk.files.get(old.entryPath);
  const dated = new TFile('Any/Nested/January 13, 2031.md');
  files.set(dated.path, dated);
  old.sourcePaths.push(dated.path);
  oldJSON.sourcePaths.push(dated.path);
  assert.equal(p.partitionHistory().current.length, 0);
  assert.equal(p.partitionHistory().previous.length, 1);
  assert.equal(p.recordKey(date), `detected:${date}`);
  await p.analyzeDate(date);
  await p.analyzeDate('2031-01-13');
  assert.deepEqual(p.records[date], oldJSON, 'old scores and source membership are never changed');
  assert.equal(disk.files.get(old.entryPath), oldMarkdown, 'original generated Markdown remains untouched');
  assert.deepEqual(p.records[`detected:${date}`].sourcePaths, [f.source.path]);
  assert.deepEqual(p.records['2031-01-13'].sourcePaths, [dated.path]);
  assert.notEqual(p.records[`detected:${date}`].entryPath, old.entryPath);
  assert.equal(p.partitionHistory().current.length, 2);
  assert.equal(p.providerCalls, 2, 'new groups are analyzed, not assigned copied old scores');

  // Renames, deletions, exclusions and ambiguous names leave preserved results
  // out of current charts until the exact new membership is analyzed.
  files.delete(dated.path); dated.path = 'Anywhere/January 14, 2031.md'; files.set(dated.path, dated);
  assert.equal(p.partitionHistory().current.length, 1);
  await p.analyzeDate('2031-01-14');
  assert.equal(p.partitionHistory().current.length, 2);
  files.delete(dated.path);
  assert.equal(p.partitionHistory().current.length, 1);
  files.set(dated.path, dated); p.settings.excludeFolders = ['Anywhere'];
  assert.equal(p.partitionHistory().current.length, 1);
  p.settings.excludeFolders = [];
  files.delete(dated.path); dated.path = 'Anywhere/01-02-2031.md'; files.set(dated.path, dated);
  assert.equal(p.getCreationDateForFile(dated), null);
  assert.equal(p.partitionHistory().current.length, 1);

  // A failed provider or source read must never retire or rewrite old history.
  const failed = await historicalFixture();
  failed.p.analyzeWithGroq = async () => { throw Object.assign(new Error('Synthetic outage'), { code: 'connection' }); };
  assert.equal(await failed.p.analyzeDate(date), false);
  assert.deepEqual(failed.p.records[date], failed.old);
  assert(failed.p.runtime.pendingDates[`detected:${date}`]);
  const unreadable = await historicalFixture();
  unreadable.p.app.vault.cachedRead = async () => { throw new Error('Synthetic unavailable source'); };
  assert.equal(await unreadable.p.analyzeDate(date), false);
  assert.equal(unreadable.p.providerCalls, 0);
  assert.equal(unreadable.p.partitionHistory().previous.length, 1);

  // Interrupted additive commit recovers without another remote request.
  const interrupted = await historicalFixture();
  const save = interrupted.p.saveData; let saves = 0;
  interrupted.p.saveData = async value => { if (++saves === 2) throw new Error('Synthetic commit interruption'); await save(value); };
  assert.equal(await interrupted.p.analyzeDate(date), false);
  assert(interrupted.disk.json.runtime.pendingWrites[`detected:${date}`]);
  const restart = fixture(interrupted.disk).p;
  await restart.onload();
  await restart.recoverPendingWrites();
  assert.equal(restart.providerCalls, 0);
  assert.deepEqual(restart.records[date], interrupted.old);
  assert.equal(restart.records[`detected:${date}`].dateBasis, 'detected-note-date');
  assert.equal(restart.partitionHistory().previous.length, 1);
  assert.equal(restart.partitionHistory().current.length, 1);

  // Old pending writes still finish as historical records, even with no
  // committed record yet. Old retries are not reused for the new scope.
  const queued = fixture();
  const oldPending = { ...priorRecord(), dateBasis: 'created-at-local-date' };
  queued.p.runtime.pendingWrites = { [date]: { version: 1, outputFolder: 'Mood History', record: oldPending, expectedHash: null } };
  queued.p.runtime.pendingDates = { [`created:${date}`]: { kind: 'storage', attempts: 1, retryAt: new Date(0).toISOString() } };
  await queued.p.savePluginData();
  const recovered = fixture(queued.disk).p;
  await recovered.onload(); await recovered.recoverPendingWrites();
  assert.equal(recovered.records[date].dateBasis, 'created-at-local-date');
  assert.equal(recovered.providerCalls, 0);
  assert.equal(recovered.runtime.pendingDates[`created:${date}`], undefined);
  await recovered.analyzeDate(date);
  assert(recovered.records[`detected:${date}`]);
  const validated = recovered.validateRecords(clone(recovered.records));
  assert.equal(Object.keys(validated).length, 2, 'both scopes survive validation and restart');
  console.log('PASS historical migration: split/collision, archive chart membership, failures, rename/delete/exclusion, and interrupted recovery');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
