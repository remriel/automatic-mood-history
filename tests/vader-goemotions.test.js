const assert = require("assert");
const fs = require("fs");
const path = require("path");
const core = require("../src/sentiment-core");
const VADER = require("../src/vendor/vaderSentiment.bundle");
const root = path.resolve(__dirname, "..");
const read = file => fs.readFileSync(path.join(root, file), "utf8");

const happy = VADER.SentimentIntensityAnalyzer.polarity_scores("I feel happy.");
const negated = VADER.SentimentIntensityAnalyzer.polarity_scores("I do not feel happy.");
assert(happy.compound > 0);
assert(negated.compound < 0);
assert(core.localSentiment("I feel happy.").moodScore > core.localSentiment("I do not feel happy.").moodScore);
assert.strictEqual(core.localSentiment("I feel happy.").confidence, "low");
assert(core.localSentiment("I do not feel happy.").drivers.some(d => d.includes("VADER")));

const main = read("src/main.js");
for (const label of ["admiration", "gratitude", "grief", "realization", "remorse", "neutral"]) {
  assert(main.includes('"' + label + '"'), "GoEmotions category missing: " + label);
}
assert(main.includes("GoEmotions taxonomy"));
assert(main.includes("author's evidenced emotions"));
assert(main.includes("not a separate classifier"));
assert(main.includes("No assessable emotional evidence"));
assert(main.includes('enableGroq: false'));
assert(main.includes('model: "openai/gpt-oss-20b"'));
assert(read("main.js").includes("SentimentIntensityAnalyzer"));
assert(read("main.js").includes("VADER Sentiment JS third-party Apache-2.0 license"));
console.log("VADER and GoEmotions integration tests passed");
