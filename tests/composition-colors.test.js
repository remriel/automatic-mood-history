const assert = require("node:assert/strict");
const { fixture } = require("./reliability-fixture");
const { p } = fixture();

// Approximate perceptual distance in CIELAB, for selecting visibly different
// categories rather than merely ensuring different hexadecimal strings.
function lab(hex) {
  const rgb = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map(v => v > .04045 ? ((v + .055) / 1.055) ** 2.4 : v / 12.92);
  const [r, g, b] = rgb;
  const xyz = [(.4124564 * r + .3575761 * g + .1804375 * b) / .95047,
    .2126729 * r + .7151522 * g + .072175 * b,
    (.0193339 * r + .119192 * g + .9503041 * b) / 1.08883];
  const f = v => v > (6 / 29) ** 3 ? Math.cbrt(v) : v / (3 * (6 / 29) ** 2) + 4 / 29;
  const [x, y, z] = xyz.map(f);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}
const distance = (a, b) => Math.hypot(...lab(a).map((v, i) => v - lab(b)[i]));
const labels = ["anxiety", "frustration", "sadness", "joy", "fear", "anger", "neutral", "calm", "curiosity", "surprise"];
assert.deepEqual(p.rankEmotions([{ emotions: ["zeta", "zeta", "alpha"] }, { emotions: ["alpha"] }]), [["alpha", 2], ["zeta", 1]], "one day contributes at most once per emotion");
const wideHistory = Array.from({ length: 12 }, (_, i) => ({ emotions: [`emotion-${String(i).padStart(2, "0")}`] }));
assert.deepEqual(p.rankEmotions(wideHistory), p.rankEmotions([...wideHistory].reverse()), "ties are stable regardless of input order");
const colors = labels.map(label => p.emotionColor(label));
assert.equal(new Set(colors).size, labels.length, "every visible emotion receives a unique color");
for (let i = 0; i < colors.length; i++) for (let j = i + 1; j < colors.length; j++) {
  assert(distance(colors[i], colors[j]) > 12, `visible categories ${labels[i]} and ${labels[j]} are perceptually separated`);
}
for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) assert(distance(colors[a], colors[b]) > 30, "anxiety, frustration and sadness have especially distinct hues");
assert.equal(p.emotionColor(" JOY "), "#f3ce53");
assert.equal(p.emotionColor("anger"), "#e6676f");
assert.equal(p.emotionColor("sadness"), "#69acd3");
const names = ["constructor", "__proto__", "Anxiety", "sadness", "sad", "frustration", "fear", "anger", "calm", "curiosity", "joy", "grief", "neutral", "alpha", "bravo", "zeta"];
assert.equal(new Set(names.map(label => p.emotionColor(label))).size, names.length, "known and historical fixture labels have distinct colors");
assert.match(p.emotionColor("constructor"), /^hsl\(/, "prototype names use the custom palette");
assert.equal(p.emotionColor("Constructor"), p.emotionColor("constructor"), "custom colors use the normalized label");
console.log("PASS emotion colors: semantic anchors, perceptual separation, and deterministic custom colors");
