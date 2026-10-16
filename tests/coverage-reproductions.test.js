const assert = require('node:assert/strict');
const { fixture, date, Mood, valid } = require('./reliability-fixture');

async function run() {
  const findings = [];
  const check = async (name, test) => { try { await test(); findings.push({ name, pass: true }); } catch (error) { findings.push({ name, pass: false, detail: error.message }); } };
  await check('final-passage edit invalidates full source hash', async () => {
    const { p, disk, source } = fixture(); p.settings.maxCharactersPerDay = 100;
    disk.files.set(source.path, 'A neutral introduction. '.repeat(20) + '\n\nI feel abandoned.');
    const first = await p.gatherDate(date);
    disk.files.set(source.path, 'A neutral introduction. '.repeat(20) + '\n\nI feel understood.');
    const second = await p.gatherDate(date);
    assert.notEqual(first.contentHash, second.contentHash);
    assert(first.analysisText.includes('abandoned'));
  });
  await check('intensity cannot conceal unresolved personal dimensions', async () => {
    const { p } = fixture(); p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
    const text = 'I feel sad and unseen, but I am still trying to reach someone.';
    let requests = 0;
    p.requestGroq = async () => { requests++; return { choices: [{ message: { content: JSON.stringify({ ...valid,
      moodScore: null, energyScore: null, connectionScore: null, intensityScore: 4,
      insights: { version: 1, evidence: [{ dimension: 'intensity', basis: 'personal', quote: text, direction: 'negative', emotion: 'sad', confidence: 'medium' }], observations: [], limitations: [] }
    }) } }] }; };
    await p.analyzeWithGroq(date, text).catch(() => {});
    assert.equal(requests, 2);
  });
  await check('stale remote fingerprint is exposed without remote calls', async () => {
    const { p } = fixture(); await p.analyzeDate(date); p.settings.model = 'openai/gpt-oss-120b';
    await p.analyzeDate(date);
    assert.equal(p.providerCalls, 1);
    assert.equal(p.runtime.analysisStates?.[date]?.state, 'stale');
  });
  await check('dashboard population is independent of mood', async () => {
    const { p } = fixture();
    const records = [{ date, dateBasis: 'created-at-local-date', status: 'complete', moodScore: null, connectionScore: 4 }];
    assert.equal(p.dashboardPopulation(records).length, 1);
  });
  console.log(JSON.stringify(findings, null, 2));
  if (!process.argv.includes('--baseline')) assert(findings.every(item => item.pass), 'coverage reproductions must all pass');
}
run().catch(error => { console.error(error); process.exitCode = 1; });
