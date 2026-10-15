const { ENGINE_VERSION, contextualAnalysis, normalizeInsights, assertProviderInsights, groundedAnalysis, compareEmotionalHistory } = require("./emotional-engine");

const ALLOWED_EMOTIONS = [
  "affectionate",
  "amused",
  "angry",
  "anxious",
  "bored",
  "confused",
  "content",
  "curious",
  "depressed",
  "disappointed",
  "disgusted",
  "dismayed",
  "disillusioned",
  "eager",
  "excited",
  "fearful",
  "frustrated",
  "guilty",
  "helpless",
  "hopeful",
  "hurt",
  "insecure",
  "isolated",
  "irritated",
  "lonely",
  "loving",
  "moved",
  "optimistic",
  "peaceful",
  "pleased",
  "powerless",
  "proud",
  "regretful",
  "relieved",
  "sad",
  "satisfied",
  "scared",
  "shameful",
  "stressed",
  "surprised",
  "worried"
];

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    moodScore: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    energyScore: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    connectionScore: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    intensityScore: { type: ["integer", "null"], minimum: 1, maximum: 5 },
    valence: {
      type: "string",
      enum: ["very_negative", "negative", "mixed", "positive", "very_positive", "unknown"]
    },
    emotions: {
      type: "array",
      minItems: 0,
      maxItems: 6,
      items: { type: "string", minLength: 1, maxLength: 48 }
    },
    summary: { type: "string" },
    drivers: {
      type: "array",
      minItems: 0,
      maxItems: 4,
      items: { type: "string" }
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    confidenceReason: { type: "string" },
    insights: {
      type: "object", additionalProperties: false,
      properties: {
        version: { type: "integer", enum: [1] },
        evidence: {
          type: "array", maxItems: 16,
          items: {
            type: "object", additionalProperties: false,
            properties: {
              dimension: { type: "string", enum: ["mood", "energy", "connection", "intensity"] },
              quote: { type: "string", minLength: 1, maxLength: 240 },
              direction: { type: "string", enum: ["positive", "negative", "mixed", "neutral"] },
              emotion: { type: "string", maxLength: 48 },
              confidence: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["dimension", "quote", "direction", "emotion", "confidence"]
          }
        },
        observations: {
          type: "array", maxItems: 8,
          items: {
            type: "object", additionalProperties: false,
            properties: {
              kind: { type: "string", enum: ["ambivalence", "contradiction", "coexistence", "sarcasm", "need", "trigger", "pattern", "change"] },
              description: { type: "string", maxLength: 300 },
              quotes: { type: "array", minItems: 1, maxItems: 3, items: { type: "string", minLength: 1, maxLength: 240 } },
              confidence: { type: "string", enum: ["low", "medium", "high"] }
            },
            required: ["kind", "description", "quotes", "confidence"]
          }
        },
        limitations: { type: "array", maxItems: 6, items: { type: "string", maxLength: 240 } }
      },
      required: ["version", "evidence", "observations", "limitations"]
    }
  },
  required: [
    "moodScore",
    "energyScore",
    "connectionScore",
    "intensityScore",
    "valence",
    "emotions",
    "summary",
    "drivers",
    "confidence",
    "confidenceReason",
    "insights"
  ]
};

function stripFrontmatter(text) {
  return text.replace(/^\uFEFF?---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, "");
}

function textForAnalysis(text) {
  return stripFrontmatter(text)
    .replace(/^\s*>\s?/gm, "")
    .replace(/!\[\[[^\]]+\]\]/g, " ")
    .replace(/!\[[^\]]*\]\([^\n]*?\)/g, " ")
    .replace(/!\[[^\]]*\]\[[^\]]*\]/g, " ")
    .replace(/<img\b[^>]*>/gi, " ")
    .replace(/```([^\n]*)\n([\s\S]*?)```/g, (_block, language, body) =>
      /^mermaid\s*$/i.test(language.trim()) && /^\s*mindmap\b/i.test(body) ? body.replace(/^\s*mindmap\b/i, "") : " ")
    .replace(/`[^`\n]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/^#.*$/gm, " ")
    .replace(/^\s*[-*]\s*$/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function deduplicateParagraphs(sourceTexts) {
  const seen = new Set();
  const paragraphs = [];
  for (const source of sourceTexts) {
    for (const raw of stripFrontmatter(source).split(/\r?\n\s*\r?\n/g)) {
      const paragraph = raw.trim();
      const normalized = paragraph.replace(/\s+/g, " ").toLowerCase();
      if (!paragraph || seen.has(normalized)) continue;
      seen.add(normalized);
      paragraphs.push(paragraph);
    }
  }
  return paragraphs.join("\n\n");
}

function sha256(text) {
  const rightRotate = (value, amount) => (value >>> amount) | (value << (32 - amount));
  const bytes = new TextEncoder().encode(text);
  const words = [];
  const bitLength = bytes.length * 8;
  const paddedLength = (((bytes.length + 9 + 63) >> 6) << 6);
  const padded = new Uint8Array(paddedLength);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(paddedLength - 4, bitLength >>> 0, false);
  view.setUint32(paddedLength - 8, Math.floor(bitLength / 0x100000000), false);

  const constants = [];
  const initial = [];
  const isComposite = {};
  for (let candidate = 2, count = 0; count < 64; candidate += 1) {
    if (isComposite[candidate]) continue;
    for (let multiple = candidate * candidate; multiple < 312; multiple += candidate) isComposite[multiple] = true;
    if (count < 8) initial[count] = (Math.pow(candidate, 0.5) * 0x100000000) | 0;
    constants[count] = (Math.pow(candidate, 1 / 3) * 0x100000000) | 0;
    count += 1;
  }

  const hash = initial.slice();
  for (let offset = 0; offset < paddedLength; offset += 64) {
    for (let index = 0; index < 16; index += 1) words[index] = view.getInt32(offset + index * 4, false);
    for (let index = 16; index < 64; index += 1) {
      const w15 = words[index - 15];
      const w2 = words[index - 2];
      const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
      const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
      words[index] = (words[index - 16] + s0 + words[index - 7] + s1) | 0;
    }
    let [a, b, c, d, e, f, g, h] = hash;
    for (let index = 0; index < 64; index += 1) {
      const sigma1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const choose = (e & f) ^ (~e & g);
      const temp1 = (h + sigma1 + choose + constants[index] + words[index]) | 0;
      const sigma0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const majority = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (sigma0 + majority) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    hash[0] = (hash[0] + a) | 0;
    hash[1] = (hash[1] + b) | 0;
    hash[2] = (hash[2] + c) | 0;
    hash[3] = (hash[3] + d) | 0;
    hash[4] = (hash[4] + e) | 0;
    hash[5] = (hash[5] + f) | 0;
    hash[6] = (hash[6] + g) | 0;
    hash[7] = (hash[7] + h) | 0;
  }

  return hash.map((value) => (value >>> 0).toString(16).padStart(8, "0")).join("");
}

function clampScore(value) {
  return Math.max(1, Math.min(5, Math.round(Number(value) || 3)));
}

function moodToValence(score) {
  return ["", "very_negative", "negative", "mixed", "positive", "very_positive"][clampScore(score)];
}

function validateAnalysis(input) {
  const moodScore = clampScore(input.moodScore);
  const emotions = Array.from(new Set((input.emotions || [])
    .filter((value) => typeof value === "string")
    .map((value) => value.trim().toLowerCase())
    .filter((value) => /^[\p{L}][\p{L}\p{M} -]{0,47}$/u.test(value)))).slice(0, 6);
  return {
    moodScore,
    energyScore: clampScore(input.energyScore),
    connectionScore: clampScore(input.connectionScore),
    intensityScore: clampScore(input.intensityScore),
    valence: ["very_negative", "negative", "mixed", "positive", "very_positive"].includes(input.valence)
      ? input.valence
      : moodToValence(moodScore),
    emotions: emotions.length ? emotions : [moodScore < 3 ? "sad" : moodScore > 3 ? "hopeful" : "confused"],
    summary: String(input.summary || "Sentiment inferred from the notes created that day.").slice(0, 500),
    drivers: (input.drivers || []).map(value => String(value).slice(0, 250)).filter(Boolean).slice(0, 4),
    confidence: ["low", "medium", "high"].includes(input.confidence) ? input.confidence : "low",
    confidenceReason: String(input.confidenceReason || "Limited or mixed evidence in the source text.").slice(0, 500)
  };
}

function localSentiment(text, topic = "") {
  return contextualAnalysis(text, topic);
}

function escapeYaml(value) {
  return JSON.stringify(String(value));
}

function plainNarrative(value, maximum = 500) {
  // Keep narrative as readable text. Entity tokens protect punctuation from
  // Markdown links, embeds, HTML, formatting and automatic URL recognition.
  return String(value || "").slice(0, maximum).replace(/[\x00-\x1f\x7f\s]+/g, " ").trim()
    .replace(/[\\`*_{}\[\]()<>#+\-.!|~^:$@%&/]/g, character => `&#${character.codePointAt(0)};`);
}

function buildEntryMarkdown(record) {
  const lines = [
    "---",
    'type: "automatic-mood-entry"',
    "automatic_mood_history: true",
    `date: ${escapeYaml(record.date)}`,
    `date_basis: ${escapeYaml(record.dateBasis || "legacy-note-date")}`,
    `status: ${escapeYaml(record.status)}`,
    `analysis_source: ${escapeYaml(record.analysisSource)}`,
    `confidence: ${escapeYaml(record.confidence || "none")}`,
    `mood: ${record.moodScore ?? "null"}`,
    `energy: ${record.energyScore ?? "null"}`,
    `connection: ${record.connectionScore ?? "null"}`,
    `intensity: ${record.intensityScore ?? "null"}`,
    `valence: ${escapeYaml(record.valence || "unknown")}`,
    "emotions:"
  ];
  if (record.emotions?.length) {
    for (const emotion of record.emotions) lines.push(`  - ${escapeYaml(emotion)}`);
  } else {
    lines[lines.length - 1] = "emotions: []";
  }
  lines.push("source_notes:");
  for (const path of record.sourcePaths || []) {
    lines.push(`  - ${escapeYaml(`[[${path.replace(/\.md$/i, "")}]]`)}`);
  }
  lines.push(
    `analyzed_at: ${escapeYaml(record.analyzedAt)}`,
    `model: ${escapeYaml(record.model || "none")}`,
    "---",
    "",
    `# Mood — ${record.date}`,
    "",
    "> [!info] Automatic inference",
    `> ${record.analysisSource === "groq" ? "Groq analyzed" : record.analysisSource === "reviewed-backfill" ? "A reviewed backfill analyzed" : record.analysisSource === "local" ? "Local scoring analyzed" : "A local fallback analyzed"} this day’s writing. This is a reading of the text, not a diagnosis or a statement of objective truth.`,
    "",
    "## Snapshot",
    ""
  );
  if (record.status === "insufficient") {
    lines.push(plainNarrative(record.summary || "There was not enough personal emotional evidence to assign scores reliably."));
  } else {
    lines.push(
      ...["mood", "energy", "connection", "intensity"].map(axis => `- **${axis[0].toUpperCase() + axis.slice(1)}:** ${Number.isFinite(record[`${axis}Score`]) ? `${record[`${axis}Score`]}/5` : "Not evidenced"}`),
      `- **Emotions:** ${plainNarrative((record.emotions || []).join(", ") || "none")}`,
      `- **Confidence:** ${plainNarrative(record.confidence)}`,
      "",
      plainNarrative(record.summary)
    );
  }
  if (record.drivers?.length) {
    lines.push("", "## Signals", "");
    for (const driver of record.drivers.slice(0, 4)) lines.push(`- ${plainNarrative(driver, 250)}`);
  }
  const insights = normalizeInsights(record.insights);
  if (insights) {
    lines.push("", "## Emotional evidence", "");
    for (const item of insights.evidence) lines.push(`- **${item.dimension} · ${item.confidence}:** ${plainNarrative(item.emotion, 48)} — “${plainNarrative(item.quote, 240)}”`);
    if (insights.observations.length) lines.push("", "## Context and complexity", "");
    for (const item of insights.observations) {
      lines.push(`- **${item.kind} · ${item.confidence}:** ${plainNarrative(item.description, 300)}`);
      for (const quote of item.quotes) lines.push(`  - Evidence: “${plainNarrative(quote, 240)}”`);
    }
    for (const limitation of insights.limitations) lines.push("", `_${plainNarrative(limitation, 240)}_`);
  }
  const comparison = record.historyComparison;
  if (comparison?.version === 1 && Array.isArray(comparison.changes) && Array.isArray(comparison.recurring)) {
    lines.push("", "## Compared with earlier writing", "");
    for (const item of comparison.changes.filter(item => item && typeof item === "object").slice(0, 4)) lines.push(`- ${plainNarrative(item.dimension, 20)}: ${plainNarrative(String(item.delta), 10)} from the earlier mean (${plainNarrative(String(item.sampleSize), 5)} observed dates).`);
    for (const item of comparison.recurring.filter(item => item && typeof item === "object").slice(0, 6)) lines.push(`- Repeated expression: ${plainNarrative(item.emotion, 48)} on ${plainNarrative(Array.isArray(item.dates) ? item.dates.join(", ") : "", 150)}.`);
    for (const item of (Array.isArray(comparison.situations) ? comparison.situations : []).filter(item => item && typeof item === "object").slice(0, 3)) {
      lines.push(`- Repeated situation wording: ${plainNarrative(item.emotion, 48)} with “${plainNarrative(item.context, 100)}” (low confidence).`);
      for (const support of (Array.isArray(item.evidence) ? item.evidence : []).filter(item => item && typeof item === "object").slice(0, 4))
        lines.push(`  - ${plainNarrative(support.date, 10)}: “${plainNarrative(support.quote, 240)}”`);
    }
    lines.push("", plainNarrative(comparison.caveat, 240));
  }
  if (record.providerIssue?.message) {
    lines.push("", "## Groq status", "", plainNarrative(record.providerIssue.message));
  }
  lines.push("", "## Sources", "");
  for (const path of record.sourcePaths || []) {
    lines.push(`- [[${path.replace(/\.md$/i, "")}|${PathBasename(path)}]]`);
  }
  lines.push("", `_${plainNarrative(record.confidenceReason)}_`, "");
  return lines.join("\n");
}

function PathBasename(path) {
  return path.split("/").pop().replace(/\.md$/i, "");
}

module.exports = {
  ENGINE_VERSION,
  ALLOWED_EMOTIONS,
  ANALYSIS_SCHEMA,
  buildEntryMarkdown,
  deduplicateParagraphs,
  localSentiment,
  normalizeInsights,
  assertProviderInsights,
  groundedAnalysis,
  compareEmotionalHistory,
  moodToValence,
  plainNarrative,
  sha256,
  stripFrontmatter,
  textForAnalysis,
  validateAnalysis
};
