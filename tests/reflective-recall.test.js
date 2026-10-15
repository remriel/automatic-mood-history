const assert = require("node:assert/strict");
const core = require("../src/sentiment-core");
const { fixture, Mood, valid } = require("./reliability-fixture");
const reply = value => ({ choices: [{ finish_reason: "stop", message: { content: JSON.stringify(value) } }] });
const response = quote => ({ ...valid, moodScore: 2, valence: "negative", emotions: ["frustrated"], insights: { version: 1, evidence: quote ? [
  { dimension: "mood", quote, emotion: "frustrated", direction: "negative", confidence: "low" }
] : [], observations: [], limitations: [] } });
async function run() {
  const { p } = fixture();
  for (const text of [
    "The arrangement has become a cage, and each compromise leaves less room to breathe.",
    "I think my resentment comes from carrying every decision alone.",
    "I want companionship, but the silence between us keeps growing.",
    'I wrote to myself: "There has to be more to living than keeping the peace."'
  ]) assert.equal(p.parseGroqAnalysis(reply(response(text)), text).moodScore, 2, "source-grounded indirect expression survives without a local lexical match");
  const markdown = '> I feel sad after the goodbye.\n\n```mermaid\nmindmap\n  root((Reflection))\n    I feel lonely after work\n    I need companionship\n```\n\n```js\nthrow new Error("happy")\n```';
  const prepared = core.textForAnalysis(markdown);
  assert(prepared.includes("I feel sad")); assert(prepared.includes("I feel lonely"));
  assert(!prepared.includes("throw new Error"));
  assert(core.localSentiment(prepared).insights.evidence.length > 0);
  const source = "I miss my friend. I need companionship and room for independence.";
  p.analyzeWithGroq = Mood.prototype.analyzeWithGroq;
  let calls = 0;
  p.requestGroq = async payload => { calls++; if(calls===2) assert(payload.messages[1].content.includes("Recheck the personal passages")); return reply(response(calls===1 ? null : source)); };
  assert.equal((await p.analyzeWithGroq("2030-01-01", source)).moodScore, 2);
  assert.equal(calls, 2);
  calls=0; p.requestGroq=async()=>{calls++;return reply(response(null));};
  await assert.rejects(p.analyzeWithGroq("2030-01-01",source), error=>error.code==="empty_evidence");
  assert.equal(calls,2,"one semantic recheck, no repeated format retries");
  calls=0;
  await p.analyzeWithGroq("2030-01-01","I study love as a literary concept.");
  assert.equal(calls,2,"one semantic review precedes abstention even without local lexical matches");
  console.log("PASS reflective/indirect evidence, self-quotation, prose mindmaps, blockquotes and bounded empty-evidence recheck");
}
run().catch(error=>{console.error(error);process.exitCode=1;});
