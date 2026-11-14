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
assert.deepEqual(p.compositionLeaders([{ emotions: ["zeta", "zeta", "alpha"] }, { emotions: ["alpha"] }]), ["alpha", "zeta"], "one day contributes at most once per emotion");
const wideHistory = Array.from({ length: 12 }, (_, i) => ({ emotions: [`emotion-${String(i).padStart(2, "0")}`] }));
assert.equal(p.compositionLeaders(wideHistory).length, 10, "global history selects at most ten labels");
assert.deepEqual(p.compositionLeaders(wideHistory), p.compositionLeaders([...wideHistory].reverse()), "ties are stable regardless of input order");
const colors = p.compositionColors(labels);
assert.equal(new Set(colors).size, labels.length, "every visible emotion receives a unique color");
for (const color of colors) assert(lab(color)[0] > 65, "the palette remains light and pastel");
for (let i = 0; i < colors.length; i++) for (let j = i + 1; j < colors.length; j++) {
  assert(distance(colors[i], colors[j]) > 20, `visible categories ${labels[i]} and ${labels[j]} are perceptually separated`);
}
for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) assert(distance(colors[a], colors[b]) > 30, "anxiety, frustration and sadness have especially distinct hues");
const colorMap = list => Object.fromEntries(list.map((label, i) => [label, p.compositionColors(list)[i]]));
assert.deepEqual(colorMap([...labels].reverse()), colorMap(labels), "frequency/order changes do not recolor the same set");
const names = ["constructor", "__proto__", "Anxiety", "sadness", "sad", "frustration", "fear", "anger", "calm", "curiosity", "joy", "grief", "neutral", "alpha", "bravo", "zeta"];
let seed = 17;
for (let trial = 0; trial < 1000; trial++) {
  const choices = [...names]; const sample = [];
  while (sample.length < 10) { seed = (1664525 * seed + 1013904223) >>> 0; sample.push(choices.splice(seed % choices.length, 1)[0]); }
  assert.equal(new Set(p.compositionColors(sample)).size, 10, "mixed and custom labels cannot collide in one chart");
  assert.deepEqual(colorMap(sample), colorMap([...sample].reverse()));
}
console.log("PASS pastel composition: perceptual separation, anchors, unique custom colors and order-independent assignment");
