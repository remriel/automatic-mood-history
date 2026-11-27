// The bundled Morning Pages module supplies its built-in word lists and matcher.
const { analyzeWriting, GROUPS } = require("./vendor/morning-pages-analysis");
const { moodToValence } = require("./sentiment-core");

const MORNING_PAGES_ANALYZER_VERSION = "morning-pages-feelings-topics-v2";

function morningPagesSentiment(text, topic = "") {
  // Pass explicit empty customizations so this copy always uses the published
  // defaults, independent of another plugin's process-local settings.
  const { feelings, topics } = analyzeWriting(text, {}, {});
  const positive = feelings.love + feelings.joy + feelings.pride;
  const negative = feelings.anxiety + feelings.anger + feelings.sadness;
  const balancedScore = (up, down) => Math.max(1, Math.min(10, Math.round(5.5 + 1.5 * (up - down))));
  const moodScore = balancedScore(positive, negative);
  const energyScore = balancedScore(feelings.joy + feelings.pride, feelings.sadness);
  const connections = feelings.love + topics.people + topics.intimacy;
  const connectionScore = Math.min(10, 6 + connections);
  const totalFeelings = Object.values(feelings).reduce((sum, value) => sum + value, 0);
  const intensityScore = Math.min(10, 1 + totalFeelings);
  const ranked = (group, counts) => GROUPS[group]
    .map(item => ({ label: item.label.toLowerCase(), count: counts[item.key] }))
    .filter(item => item.count > 0).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const emotions = ranked("feelings", feelings).slice(0, 6).map(item => item.label);
  const topicLabels = ranked("topics", topics).slice(0, 3).map(item => item.label);
  const drivers = [
    `Feeling word matches: ${positive} positive, ${negative} negative.`,
    topicLabels.length ? `Topic categories: ${topicLabels.join(", ")}.` : "No topic categories matched."
  ];
  return {
    moodScore, energyScore, connectionScore, intensityScore,
    valence: moodToValence(moodScore),
    emotions,
    summary: topic || `Morning Pages word-list estimate${topicLabels.length ? `; topics: ${topicLabels.join(", ")}` : ""}.`,
    drivers,
    confidence: "low",
    confidenceReason: "Word counts are approximate and may misread negation, quotations, or feelings attributed to others."
  };
}

module.exports = { morningPagesSentiment, MORNING_PAGES_ANALYZER_VERSION };
