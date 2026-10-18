/*
Adapted from UsmarHaider/moodring web/model.js at 0520258846018979e7d24bd5597adaabccde4f87. MIT license. The predictions describe the text, not the writer's verified feelings.

MIT License

Copyright (c) 2026 Usmar Haider

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/
// JS runtime for the exported moodring model. Mirrors the sklearn pipeline:
// tokenize (runs of >=2 word chars, lowercased), unigrams+bigrams, sublinear
// tf, idf, l2 norm, then per-label logistic scores. Works in browser and Node.

const TOKEN_RE = /[\p{L}\p{N}_]{2,}/gu;

function parseModel(buffer) {
  const bytes = new Uint8Array(buffer);
  const magic = new TextDecoder().decode(bytes.subarray(0, 9));
  if (magic !== "MOODRING1") throw new Error("bad model file");
  const jsonLen = new DataView(buffer).getUint32(9, true);
  const meta = JSON.parse(new TextDecoder().decode(bytes.subarray(13, 13 + jsonLen)));
  const n = meta.n_features;
  let off = 13 + jsonLen;
  const idf = new Float32Array(buffer.slice(off, off + 4 * n));
  off += 4 * n;
  const coef = new Float32Array(buffer.slice(off, off + 4 * n * meta.emotions.length));
  const vocab = new Map(meta.terms.map((t, i) => [t, i]));
  return { meta, idf, coef, vocab, n };
}

function tokenize(text) {
  return (text.toLowerCase().match(TOKEN_RE) || []);
}

function vectorize(model, text) {
  const tokens = tokenize(text);
  const grams = tokens.slice();
  for (let i = 0; i + 1 < tokens.length; i++) grams.push(tokens[i] + " " + tokens[i + 1]);
  const counts = new Map();
  for (const g of grams) {
    const idx = model.vocab.get(g);
    if (idx !== undefined) counts.set(idx, (counts.get(idx) || 0) + 1);
  }
  let normSq = 0;
  const entries = [];
  for (const [idx, tf] of counts) {
    const w = (1 + Math.log(tf)) * model.idf[idx];
    entries.push([idx, w]);
    normSq += w * w;
  }
  const norm = Math.sqrt(normSq) || 1;
  return entries.map(([idx, w]) => [idx, w / norm]);
}

function scores(model, text) {
  const x = vectorize(model, text);
  const { emotions, intercept } = model.meta;
  const out = {};
  for (let j = 0; j < emotions.length; j++) {
    let margin = intercept[j];
    const row = j * model.n;
    for (const [idx, w] of x) margin += model.coef[row + idx] * w;
    out[emotions[j]] = 1 / (1 + Math.exp(-margin));
  }
  return out;
}

function predict(model, text) {
  const s = scores(model, text);
  const { emotions, thresholds } = model.meta;
  let labels = emotions.filter((e, j) => s[e] >= thresholds[j]);
  const fallback = labels.length === 0;
  if (fallback) {
    labels = [emotions.reduce((a, b) => (s[a] >= s[b] ? a : b))];
  }
  const rounded = {};
  for (const e of emotions) rounded[e] = Math.round(s[e] * 10000) / 10000;
  const thr = {};
  emotions.forEach((e, j) => (thr[e] = Math.round(thresholds[j] * 100) / 100));
  return { labels, fallback, scores: rounded, thresholds: thr };
}

const MOODRING_VERSION = "moodring-05202588-v1";
const MOODRING_LABELS = Object.freeze(["admiration","amusement","anger","annoyance","approval","caring","confusion","curiosity","desire","disappointment","disapproval","disgust","embarrassment","excitement","fear","gratitude","grief","joy","love","nervousness","optimism","pride","realization","relief","remorse","sadness","surprise","neutral"]);
function validatedModel(input) {
  const bytes = input instanceof ArrayBuffer ? new Uint8Array(input) : input;
  if (!(bytes instanceof Uint8Array) || bytes.byteLength < 13 || bytes.byteLength > 10000000) throw new Error("Moodring model size invalid.");
  const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  const view = new DataView(buffer);
  if (new TextDecoder().decode(bytes.subarray(0, 9)) !== "MOODRING1") throw new Error("Moodring model magic invalid.");
  const metaSize = view.getUint32(9, true);
  if (metaSize < 50 || metaSize > 2000000 || 13 + metaSize > bytes.byteLength) throw new Error("Moodring model metadata size invalid.");
  let meta;
  try { meta = JSON.parse(new TextDecoder().decode(bytes.subarray(13, 13 + metaSize))); }
  catch { throw new Error("Moodring model metadata invalid."); }
  const n = meta?.n_features, k = MOODRING_LABELS.length;
  if (!Number.isInteger(n) || n < 1 || n > 60000 ||
      !Array.isArray(meta.terms) || meta.terms.length !== n ||
      !Array.isArray(meta.emotions) || meta.emotions.length !== k ||
      meta.emotions.some((v,i) => v !== MOODRING_LABELS[i]) ||
      !Array.isArray(meta.thresholds) || meta.thresholds.length !== k ||
      meta.thresholds.some(v => !Number.isFinite(v) || v <= 0 || v >= 1) ||
      !Array.isArray(meta.intercept) || meta.intercept.length !== k ||
      meta.intercept.some(v => !Number.isFinite(v)) ||
      13 + metaSize + 4 * n * (k + 1) !== bytes.byteLength) throw new Error("Moodring model shape invalid.");
  if (meta.terms.some(v => typeof v !== "string" || v.length > 128 || !v) ||
      new Set(meta.terms).size !== n) throw new Error("Moodring model vocabulary invalid.");
  // Avoid NaN/Infinity scores from corrupted local binary files.
  for (let pos = 13 + metaSize; pos < bytes.byteLength; pos += 4) {
    if (!Number.isFinite(view.getFloat32(pos,true))) throw new Error("Moodring model contains invalid weights.");
  }
  return parseModel(buffer);
}
function compareMoodring(model, text) {
  if (typeof text !== "string" || !text.trim()) return null;
  const max = 12000;
  const subset = text.slice(0, max);
  const windows = subset.match(/[\s\S]{1,1200}/g) || [];
  const values = new Map(MOODRING_LABELS.map(e=>[e,0]));
  for (const windowText of windows) {
    const prediction = predict(model, windowText);
    for (const e of MOODRING_LABELS) values.set(e, values.get(e) + prediction.scores[e] / windows.length);
  }
  const labels = MOODRING_LABELS.filter((e,j)=>e!=="neutral" && values.get(e)>=model.meta.thresholds[j])
    .map(e=>({label:e,score:Number(values.get(e).toFixed(4))}))
    .sort((a,b)=>b.score-a.score).slice(0,4);
  return { version: MOODRING_VERSION, labels, abstained: labels.length===0,
    coveredChars:subset.length, truncated:text.length>max };
}
module.exports = { MOODRING_VERSION, MOODRING_LABELS, validatedModel, compareMoodring };
