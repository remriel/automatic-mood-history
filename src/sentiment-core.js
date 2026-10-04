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
    moodScore: { type: "integer", minimum: 1, maximum: 5 },
    energyScore: { type: "integer", minimum: 1, maximum: 5 },
    connectionScore: { type: "integer", minimum: 1, maximum: 5 },
    intensityScore: { type: "integer", minimum: 1, maximum: 5 },
    valence: {
      type: "string",
      enum: ["very_negative", "negative", "mixed", "positive", "very_positive"]
    },
    emotions: {
      type: "array",
      minItems: 1,
      maxItems: 6,
      items: { type: "string", enum: ALLOWED_EMOTIONS }
    },
    summary: { type: "string" },
    drivers: {
      type: "array",
      minItems: 1,
      maxItems: 4,
      items: { type: "string" }
    },
    confidence: { type: "string", enum: ["low", "medium", "high"] },
    confidenceReason: { type: "string" }
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
    "confidenceReason"
  ]
};

const EMOTION_LEXICON = {
  affectionate: ["affection", "affectionate", "care", "caring", "tender", "fond"],
  amused: ["amused", "funny", "laugh", "laughing", "joke", "playful"],
  angry: ["angry", "anger", "furious", "rage", "pissed", "mad"],
  anxious: ["anxious", "anxiety", "panic", "panicking", "nervous", "worry", "worried"],
  bored: ["bored", "boring", "stagnant", "sameness", "nothing happens"],
  confused: ["confused", "confusing", "uncertain", "don't understand", "cannot understand"],
  content: ["content", "comfortable", "at ease", "satisfied"],
  curious: ["curious", "curiosity", "wonder", "question", "discover"],
  depressed: ["depressed", "depression", "bleak", "hopeless", "misery", "miserable"],
  disappointed: ["disappointed", "disappointment", "let down", "failed"],
  disgusted: ["disgusted", "disgusting", "grotesque", "repulsed"],
  dismayed: ["dismayed", "shocked", "horrified", "appalled"],
  disillusioned: ["disillusioned", "illusion", "false", "lie", "betrayal"],
  eager: ["eager", "hungry for", "can't wait", "want to"],
  excited: ["excited", "excitement", "alive", "electric", "thrilled"],
  fearful: ["fear", "fearful", "afraid", "dread", "scared"],
  frustrated: ["frustrated", "frustration", "stuck", "blocked", "trapped"],
  guilty: ["guilty", "guilt", "responsible for", "my fault"],
  helpless: ["helpless", "can't do anything", "cannot do anything", "no control"],
  hopeful: ["hope", "hopeful", "possibility", "future", "better"],
  hurt: ["hurt", "painful", "pain", "wounded"],
  insecure: ["insecure", "rejected", "unwanted", "not enough"],
  isolated: ["isolated", "withdrawal", "alone", "closed system", "cut off"],
  irritated: ["irritated", "annoyed", "bothering", "snapped"],
  lonely: ["lonely", "loneliness", "nobody", "no one", "unseen"],
  loving: ["love", "loving", "devotion", "loyalty"],
  moved: ["moved", "touched", "meaningful", "matters to me"],
  optimistic: ["optimistic", "confident", "will improve", "can improve"],
  peaceful: ["peace", "peaceful", "calm", "relaxed"],
  pleased: ["pleased", "glad", "happy", "delighted", "joy"],
  powerless: ["powerless", "dependent", "no money", "no resources", "cannot leave"],
  proud: ["proud", "accomplished", "achievement", "stronger"],
  regretful: ["regret", "regretful", "wish i had", "should have"],
  relieved: ["relieved", "relief", "finally free", "weight lifted"],
  sad: ["sad", "sadness", "sorrow", "cry", "grief", "unhappy"],
  satisfied: ["satisfied", "fulfilled", "enough", "gratified"],
  scared: ["scared", "terrified", "frightened", "spooked"],
  shameful: ["shame", "ashamed", "embarrassed", "humiliated"],
  stressed: ["stressed", "stress", "exhausted", "overwhelmed", "drained", "burned out"],
  surprised: ["surprised", "unexpected", "astonished", "amazed"],
  worried: ["worried", "worry", "concerned", "what if"]
};

const POSITIVE_WORDS = [
  "love", "joy", "happy", "hope", "hopeful", "alive", "excited", "playful",
  "connection", "connected", "affection", "grateful", "stronger", "better",
  "curious", "freedom", "possibility", "fun", "calm", "peace", "proud"
];

const NEGATIVE_WORDS = [
  "hate", "angry", "sad", "miserable", "depressed", "hopeless", "trapped",
  "stuck", "exhausted", "drained", "resent", "lonely", "isolated", "fear",
  "afraid", "guilty", "shame", "disgust", "bleak", "dead", "death", "hurt",
  "pain", "frustrated", "unwanted", "rejected", "powerless", "nothing"
];

const ENERGY_UP = [
  "energy", "move", "movement", "run", "travel", "create", "build", "want",
  "desire", "ambition", "excited", "alive", "initiative", "action", "play"
];

const ENERGY_DOWN = [
  "tired", "exhausted", "drained", "stuck", "passive", "stagnant", "nothing",
  "bored", "sleep", "flat", "heavy", "burned out", "no energy"
];

const CONNECTION_UP = [
  "connection", "connected", "friend", "friends", "together", "love", "care",
  "affection", "community", "family", "share", "conversation", "understand"
];

const CONNECTION_DOWN = [
  "alone", "lonely", "isolated", "withdrawal", "unseen", "unwanted", "absent",
  "disconnect", "wall", "closed system", "nobody", "no one", "rejected"
];

function countTerms(text, terms) {
  return terms.reduce((total, term) => {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matches = text.match(new RegExp(`\\b${escaped}\\b`, "gi"));
    return total + (matches ? matches.length : 0);
  }, 0);
}

function stripFrontmatter(text) {
  return text.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "");
}

function textForAnalysis(text) {
  return stripFrontmatter(text)
    .replace(/!\[\[[^\]]+\]\]/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
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
    .map((value) => String(value).toLowerCase())
    .filter((value) => ALLOWED_EMOTIONS.includes(value)))).slice(0, 6);
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
    drivers: (input.drivers || []).map(String).filter(Boolean).slice(0, 4),
    confidence: ["low", "medium", "high"].includes(input.confidence) ? input.confidence : "low",
    confidenceReason: String(input.confidenceReason || "Limited or mixed evidence in the source text.").slice(0, 500)
  };
}

function localSentiment(text, topic = "") {
  const normalized = text.toLowerCase();
  const positive = countTerms(normalized, POSITIVE_WORDS);
  const negative = countTerms(normalized, NEGATIVE_WORDS);
  const total = positive + negative;
  const ratio = total ? (positive - negative) / total : 0;
  let moodScore = 3;
  if (ratio <= -0.45) moodScore = 1;
  else if (ratio < -0.12) moodScore = 2;
  else if (ratio >= 0.5) moodScore = 5;
  else if (ratio > 0.15) moodScore = 4;

  const energyUp = countTerms(normalized, ENERGY_UP);
  const energyDown = countTerms(normalized, ENERGY_DOWN);
  let energyScore = 3;
  if (energyDown > energyUp * 1.5) energyScore = energyDown >= 6 ? 1 : 2;
  else if (energyUp > energyDown * 1.5) energyScore = energyUp >= 6 ? 5 : 4;

  const connected = countTerms(normalized, CONNECTION_UP);
  const disconnected = countTerms(normalized, CONNECTION_DOWN);
  let connectionScore = 3;
  if (disconnected > connected * 1.4) connectionScore = disconnected >= 5 ? 1 : 2;
  else if (connected > disconnected * 1.4) connectionScore = connected >= 5 ? 5 : 4;

  const profanity = (normalized.match(/\b(fuck|fucking|bitch|shit|damn)\b/g) || []).length;
  const exclamations = (text.match(/!/g) || []).length;
  const emotionDensity = Math.min(20, total + profanity + exclamations);
  const intensityScore = emotionDensity >= 12 ? 5 : emotionDensity >= 7 ? 4 : emotionDensity >= 3 ? 3 : emotionDensity >= 1 ? 2 : 1;

  const ranked = Object.entries(EMOTION_LEXICON)
    .map(([emotion, terms]) => [emotion, countTerms(normalized, terms)])
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([emotion]) => emotion);

  const drivers = [];
  if (negative > positive) drivers.push("Negative emotional language outweighs positive language.");
  if (positive > negative) drivers.push("Positive and possibility-oriented language outweighs negative language.");
  if (disconnected > connected) drivers.push("Isolation or disconnection language is prominent.");
  if (connected > disconnected) drivers.push("Connection, care, or relationship language is prominent.");
  if (energyDown > energyUp) drivers.push("Depletion and stagnation language lowers the inferred energy score.");
  if (energyUp > energyDown) drivers.push("Movement and desire language raises the inferred energy score.");

  return validateAnalysis({
    moodScore,
    energyScore,
    connectionScore,
    intensityScore,
    valence: moodToValence(moodScore),
    emotions: ranked,
    summary: topic || "Local sentiment estimate from the day's writing.",
    drivers: drivers.slice(0, 4),
    confidence: "low",
    confidenceReason: "This entry uses deterministic word-pattern scoring and should be treated as directional."
  });
}

function escapeYaml(value) {
  return JSON.stringify(String(value));
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
    lines.push("There was not enough written text to infer a mood reliably.");
  } else {
    lines.push(
      `- **Mood:** ${record.moodScore}/5`,
      `- **Energy:** ${record.energyScore}/5`,
      `- **Connection:** ${record.connectionScore}/5`,
      `- **Intensity:** ${record.intensityScore}/5`,
      `- **Emotions:** ${(record.emotions || []).join(", ") || "none"}`,
      `- **Confidence:** ${record.confidence}`,
      "",
      record.summary || ""
    );
  }
  if (record.drivers?.length) {
    lines.push("", "## Signals", "");
    for (const driver of record.drivers) lines.push(`- ${driver}`);
  }
  if (record.providerIssue?.message) {
    lines.push("", "## Groq status", "", record.providerIssue.message);
  }
  lines.push("", "## Sources", "");
  for (const path of record.sourcePaths || []) {
    lines.push(`- [[${path.replace(/\.md$/i, "")}|${PathBasename(path)}]]`);
  }
  lines.push("", `_${record.confidenceReason || ""}_`, "");
  return lines.join("\n");
}

function PathBasename(path) {
  return path.split("/").pop().replace(/\.md$/i, "");
}

module.exports = {
  ALLOWED_EMOTIONS,
  ANALYSIS_SCHEMA,
  buildEntryMarkdown,
  deduplicateParagraphs,
  localSentiment,
  moodToValence,
  sha256,
  stripFrontmatter,
  textForAnalysis,
  validateAnalysis
};
