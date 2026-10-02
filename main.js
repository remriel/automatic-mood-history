/* Automatic Mood History — bundled for Obsidian. */
/* Source files: src/main.js + src/sentiment-core.js */
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
      uniqueItems: true,
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
    confidenceReason: "Groq was unavailable, so this entry uses deterministic word-pattern scoring and should be treated as directional."
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
    `> ${record.analysisSource === "groq" ? "Groq analyzed" : record.analysisSource === "reviewed-backfill" ? "A reviewed backfill analyzed" : "A local fallback analyzed"} this day’s writing. This is a reading of the text, not a diagnosis or a statement of objective truth.`,
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


const {
  Component,
  Notice,
  Plugin,
  PluginSettingTab,
  Setting,
  TFile,
  TFolder,
  requestUrl
} = require("obsidian");


const GROQ_API_KEY_ENV = "GROQ_API_KEY";
const CREATED_DATE_BASIS = "created-at-local-date";
const LEGACY_DATE_BASIS = "legacy-note-date";

const DEFAULT_SETTINGS = {
  enableGroq: false,
  model: "openai/gpt-oss-20b",
  outputFolder: "Mood History",
  autoAnalyze: false,
  analyzeOnStartup: false,
  debounceMilliseconds: 5000,
  minimumCharacters: 40,
  maxCharactersPerDay: 60000
};

class AutomaticMoodHistoryPlugin extends Plugin {
  async onload() {
    const loaded = (await this.loadData()) || {};
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded.settings || {});
    // Version 1.1.0 let synced vault data choose any process variable. Keep
    // reading only the one documented provider key after upgrading.
    this.settings.apiKeyEnvironmentVariable = GROQ_API_KEY_ENV;
    delete this.settings.dailyFolder;
    delete this.settings.includeOutsideDailyFolder;
    this.records = loaded.records || {};
    for (const record of Object.values(this.records)) {
      if (record?.analysisSource === "assistant-backfill") record.analysisSource = "reviewed-backfill";
      if (record && !record.dateBasis) record.dateBasis = LEGACY_DATE_BASIS;
    }
    this.runtime = loaded.runtime || {};
    this.runtime.lastLoadedAt = new Date().toISOString();
    this.runtime.version = this.manifest.version;
    this.runtime.apiKeyDetected = Boolean(globalThis.process?.env?.[GROQ_API_KEY_ENV]);
    this.runtime.lastLoadStatus = "loaded";
    this.debounceTimers = new Map();
    this.renderContainers = new Set();
    this.groqBlockedUntil = 0;
    this.lastGroqError = "";

    await this.savePluginData();

    this.addRibbonIcon("activity", "Open Automatic Mood History", () => this.openDashboard());
    this.addCommand({
      id: "open-dashboard",
      name: "Open mood history dashboard",
      callback: () => this.openDashboard()
    });
    this.addCommand({
      id: "analyze-changed-daily-notes",
      name: "Analyze changed notes",
      callback: () => this.analyzeAll({ force: false, forceGroq: false })
    });
    this.addCommand({
      id: "reanalyze-all-with-groq",
      name: "Reanalyze all notes with Groq",
      callback: () => this.retryAllWithGroq()
    });
    this.addCommand({
      id: "analyze-active-note",
      name: "Analyze the active note",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        const date = file ? this.getCreationDateForFile(file) : null;
        if (!date) {
          new Notice("Automatic Mood History: the active note has no creation timestamp.");
          return;
        }
        await this.analyzeDate(date, { force: true, forceGroq: false });
        new Notice(`Automatic Mood History: analyzed ${date}.`);
      }
    });

    this.registerMarkdownCodeBlockProcessor("automatic-mood-history", (_source, element, context) => {
      this.renderContainers.add(element);
      const child = new Component();
      child.onunload = () => this.renderContainers.delete(element);
      context.addChild(child);
      this.renderDashboard(element);
    });

    this.addSettingTab(new AutomaticMoodHistorySettingTab(this.app, this));

    this.app.workspace.onLayoutReady(async () => {
      this.registerSourceEvents();
      try {
        await this.ensureSupportFiles();
        await this.savePluginData();
      } catch (error) {
        console.error("Automatic Mood History could not prepare its history files", error);
        new Notice(`Automatic Mood History loaded, but could not prepare its history files: ${error.message}`, 9000);
      }
      if (this.settings.analyzeOnStartup) {
        const startupTimer = window.setTimeout(() => {
          void this.analyzeAll({ force: false, forceGroq: false });
        }, 1800);
        this.register(() => window.clearTimeout(startupTimer));
      }
    });
  }

  onunload() {
    for (const timer of this.debounceTimers.values()) window.clearTimeout(timer);
    this.debounceTimers.clear();
    this.renderContainers.clear();
  }

  async savePluginData() {
    const settings = Object.assign({}, this.settings);
    delete settings.apiKeyEnvironmentVariable;
    await this.saveData({ settings, records: this.records, runtime: this.runtime });
  }

  registerSourceEvents() {
    this.registerEvent(this.app.vault.on("create", (file) => this.handleSourceEvent(file)));
    this.registerEvent(this.app.vault.on("modify", (file) => this.handleSourceEvent(file)));
    this.registerEvent(this.app.vault.on("delete", (file) => this.handleSourceEvent(file)));
    this.registerEvent(this.app.vault.on("rename", (file, oldPath) => {
      if (!this.settings.autoAnalyze || !(file instanceof TFile)) return;
      const affectedDates = new Set([
        this.getCreationDateForFile(file, oldPath),
        this.getCreationDateForFile(file)
      ].filter(Boolean));
      for (const date of affectedDates) this.scheduleDate(date);
    }));
  }

  get outputFolder() {
    return this.settings.outputFolder.replace(/^\/+|\/+$/g, "");
  }

  get dashboardPath() {
    return `${this.outputFolder}/Mood History.md`;
  }

  get entriesFolder() {
    return `${this.outputFolder}/Entries`;
  }

  getCreationDateForFile(file, path = file?.path) {
    if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") return null;
    const normalizedPath = String(path || "").replace(/\\/g, "/").replace(/^\/+/, "");
    const outputFolder = this.outputFolder;
    if ((outputFolder && (normalizedPath === outputFolder || normalizedPath.startsWith(`${outputFolder}/`))) ||
      normalizedPath === ".trash" || normalizedPath.startsWith(".trash/")) return null;

    const timestamp = file.stat?.ctime;
    if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
    const createdAt = new Date(timestamp);
    if (Number.isNaN(createdAt.valueOf())) return null;
    const year = createdAt.getFullYear();
    const month = String(createdAt.getMonth() + 1).padStart(2, "0");
    const day = String(createdAt.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  topicForFile(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const topic = cache?.frontmatter?.topic;
    return typeof topic === "string" ? topic.trim() : "";
  }

  getAllDates() {
    return Array.from(new Set(
      this.app.vault.getMarkdownFiles().map((file) => this.getCreationDateForFile(file)).filter(Boolean)
    )).sort();
  }

  filesForDate(date) {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => this.getCreationDateForFile(file) === date)
      .sort((a, b) => a.path.localeCompare(b.path));
  }

  async gatherDate(date) {
    const files = this.filesForDate(date);
    const sourceTexts = [];
    const topics = [];
    for (const file of files) {
      const content = await this.app.vault.cachedRead(file);
      if (textForAnalysis(content).length > 0) sourceTexts.push(content);
      const topic = this.topicForFile(file);
      if (topic) topics.push(topic);
    }
    const combinedMarkdown = deduplicateParagraphs(sourceTexts);
    const analysisText = textForAnalysis(combinedMarkdown).slice(0, this.settings.maxCharactersPerDay);
    const sourcePaths = files.map((file) => file.path);
    return {
      date,
      sourcePaths,
      analysisText,
      topic: Array.from(new Set(topics)).join(" / "),
      contentHash: sha256(JSON.stringify({ sourcePaths, analysisText }))
    };
  }

  handleSourceEvent(file) {
    if (!this.settings.autoAnalyze || !(file instanceof TFile)) return;
    const date = this.getCreationDateForFile(file);
    if (date) this.scheduleDate(date);
  }

  scheduleDate(date) {
    const existing = this.debounceTimers.get(date);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(async () => {
      this.debounceTimers.delete(date);
      try {
        await this.analyzeDate(date, { force: false, forceGroq: false });
      } catch (error) {
        console.error("Automatic Mood History failed to analyze a changed note", error);
        new Notice(`Automatic Mood History could not analyze ${date}: ${error.message}`);
      }
    }, this.settings.debounceMilliseconds);
    this.debounceTimers.set(date, timer);
  }

  apiKey() {
    const value = globalThis.process?.env?.[GROQ_API_KEY_ENV];
    return typeof value === "string" ? value.trim() : "";
  }

  async requestGroq(payload) {
    const response = await requestUrl({
      url: "https://api.groq.com/openai/v1/chat/completions",
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey()}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload),
      throw: false
    });
    if (response.status < 200 || response.status >= 300) {
      const message = response.json?.error?.message || response.text || `HTTP ${response.status}`;
      const error = new Error(`Groq ${response.status}: ${message}`);
      error.status = response.status;
      throw error;
    }
    return response.json;
  }

  groqPrompt(date, text) {
    return [
      `Local creation date: ${date}`,
      "Analyze the emotional state expressed across the Markdown notes created on this date.",
      "Distinguish the author's emotions from emotions attributed to other people, quoted material, abstract analysis, hypotheticals, and negated feelings.",
      "Do not diagnose mental illness. Score only evidence present in the writing.",
      "Mood: 1 severe distress/strongly negative, 2 negative, 3 mixed or neutral, 4 positive, 5 strongly positive.",
      "Energy: 1 depleted/inert through 5 highly activated. Negative agitation may have high intensity but is not automatically high healthy energy.",
      "Connection: 1 isolated/unseen through 5 deeply connected/supported.",
      "Intensity: 1 emotionally muted through 5 extremely forceful or emotionally charged.",
      "Keep the summary under 60 words and each driver under 24 words.",
      "",
      text
    ].join("\n");
  }

  async analyzeWithGroq(date, text) {
    if (!this.apiKey()) throw new Error(`Environment variable ${GROQ_API_KEY_ENV} is missing.`);
    if (Date.now() < this.groqBlockedUntil) throw new Error(this.lastGroqError || "Groq retry is temporarily paused.");

    const base = {
      model: this.settings.model,
      messages: [
        {
          role: "system",
          content: "You are a precise journal sentiment analyst. Return only the requested structured data. Never infer a diagnosis."
        },
        { role: "user", content: this.groqPrompt(date, text) }
      ],
      temperature: 0.1,
      max_completion_tokens: 1600,
      citation_options: "disabled"
    };

    const schemaInstruction = `Return one JSON object matching this schema exactly: ${JSON.stringify(ANALYSIS_SCHEMA)}`;
    const attempts = [
      {
        name: "strict structured output",
        payload: {
          ...base,
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "daily_mood_analysis",
              strict: true,
              schema: ANALYSIS_SCHEMA
            }
          }
        }
      },
      {
        name: "JSON object mode",
        payload: {
          ...base,
          messages: [...base.messages, { role: "system", content: schemaInstruction }],
          response_format: { type: "json_object" }
        }
      },
      {
        name: "plain JSON fallback",
        payload: {
          ...base,
          messages: [
            ...base.messages,
            {
              role: "system",
              content: `${schemaInstruction} Output raw JSON only: no Markdown fence, preface, or explanation.`
            }
          ]
        }
      }
    ];

    const failures = [];
    for (const attempt of attempts) {
      try {
        const response = await this.requestGroq(attempt.payload);
        const raw = response?.choices?.[0]?.message?.content;
        if (typeof raw !== "string" || !raw.trim()) throw new Error("Groq returned no analysis content.");
        const unfenced = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
        const objectStart = unfenced.indexOf("{");
        const objectEnd = unfenced.lastIndexOf("}");
        if (objectStart < 0 || objectEnd <= objectStart) throw new Error("Groq returned no JSON object.");
        return validateAnalysis(JSON.parse(unfenced.slice(objectStart, objectEnd + 1)));
      } catch (error) {
        failures.push(`${attempt.name}: ${error.message}`);
        if (error.status && ![400, 422].includes(error.status)) throw error;
      }
    }
    const error = new Error(`Groq could not produce valid structured sentiment after ${attempts.length} attempts. ${failures.join(" | ")}`);
    error.status = 422;
    throw error;
  }

  async analyzeDate(date, options = {}) {
    const gathered = await this.gatherDate(date);
    const previous = this.records[date];
    if (!options.force && previous?.contentHash === gathered.contentHash) {
      if (previous.dateBasis === CREATED_DATE_BASIS) return false;
      previous.dateBasis = CREATED_DATE_BASIS;
      await this.savePluginData();
      this.refreshRenderers();
      return true;
    }

    let record;
    if (gathered.analysisText.length < this.settings.minimumCharacters) {
      record = {
        date,
        status: "insufficient",
        analysisSource: "none",
        model: "none",
        moodScore: null,
        energyScore: null,
        connectionScore: null,
        intensityScore: null,
        valence: "unknown",
        emotions: [],
        summary: "Not enough written text to infer a mood reliably.",
        drivers: [],
        confidence: "none",
        confidenceReason: "Notes created on this date were empty or contained only non-text material."
      };
    } else {
      let analysis;
      let analysisSource;
      let model;
      const canTryGroq = this.settings.enableGroq && (options.forceGroq || Date.now() >= this.groqBlockedUntil);
      if (canTryGroq) {
        try {
          analysis = await this.analyzeWithGroq(date, gathered.analysisText);
          analysisSource = "groq";
          model = this.settings.model;
          this.lastGroqError = "";
          this.groqBlockedUntil = 0;
          this.runtime.lastGroqError = "";
          this.runtime.lastGroqSuccessAt = new Date().toISOString();
        } catch (error) {
          this.lastGroqError = error.message;
          this.groqBlockedUntil = Date.now() + 15 * 60 * 1000;
          this.runtime.lastGroqError = error.message;
          this.runtime.lastGroqFailureAt = new Date().toISOString();
          analysis = localSentiment(gathered.analysisText, gathered.topic);
          analysisSource = "local-fallback";
          model = "deterministic-lexicon-v1";
          console.warn("Automatic Mood History used local fallback", error);
        }
      } else {
        analysis = localSentiment(gathered.analysisText, gathered.topic);
        analysisSource = "local-fallback";
        model = "deterministic-lexicon-v1";
      }
      record = {
        date,
        status: "complete",
        analysisSource,
        model,
        ...analysis
      };
    }

    Object.assign(record, {
      dateBasis: CREATED_DATE_BASIS,
      contentHash: gathered.contentHash,
      sourcePaths: gathered.sourcePaths,
      analyzedAt: new Date().toISOString()
    });
    await this.writeEntryNote(record);
    this.records[date] = record;
    await this.savePluginData();
    this.refreshRenderers();
    return true;
  }

  async analyzeAll(options = {}) {
    const dates = this.getAllDates();
    new Notice(`Automatic Mood History: checking ${dates.length} creation-date groups…`);
    let changed = 0;
    for (const date of dates) {
      if (await this.analyzeDate(date, options)) changed += 1;
    }
    await this.ensureSupportFiles();
    const suffix = this.lastGroqError ? " Groq was unavailable; affected entries use the labeled local fallback." : "";
    new Notice(`Automatic Mood History: ${changed} creation-date groups updated.${suffix}`, 9000);
  }

  async retryAllWithGroq() {
    if (!this.settings.enableGroq) {
      new Notice("Automatic Mood History: enable Groq analysis in settings before using this command.");
      return;
    }
    await this.analyzeAll({ force: true, forceGroq: true });
  }

  async ensureFolder(path) {
    const normalized = path.replace(/^\/+|\/+$/g, "");
    if (!normalized) return;

    const folderExists = async (folderPath) => {
      const abstractFile = this.app.vault.getAbstractFileByPath(folderPath);
      if (abstractFile) {
        if (!(abstractFile instanceof TFolder)) {
          throw new Error(`Expected a folder at "${folderPath}".`);
        }
        return true;
      }

      // The adapter can see folders on disk before Obsidian's abstract-file
      // cache indexes them. Check it before creating folders during startup.
      const stat = await this.app.vault.adapter.stat(folderPath);
      if (!stat) return false;
      if (stat.type !== "folder") throw new Error(`Expected a folder at "${folderPath}".`);
      return true;
    };

    const parts = normalized.split("/");
    let current = "";
    for (const part of parts) {
      current = current ? `${current}/${part}` : part;
      if (await folderExists(current)) continue;
      try {
        await this.app.vault.createFolder(current);
      } catch (error) {
        // Another startup task may create the same directory between the
        // existence check and createFolder. Ignore only a confirmed folder.
        if (await folderExists(current)) continue;
        throw error;
      }
    }
  }

  async writeTextFile(path, content, overwrite = false) {
    const existing = this.app.vault.getAbstractFileByPath(path);
    if (existing instanceof TFile) {
      if (overwrite) await this.app.vault.modify(existing, content);
      return existing;
    }
    return this.app.vault.create(path, content);
  }

  async writeEntryNote(record) {
    await this.ensureFolder(this.entriesFolder);
    const path = await this.resolveEntryPath(record);
    record.entryPath = path;
    await this.writeTextFile(path, buildEntryMarkdown(record), true);
  }

  async isOwnedEntry(file, date) {
    if (!(file instanceof TFile)) return false;
    const content = await this.app.vault.cachedRead(file);
    const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
    if (!match) return false;
    const fields = new Set(match[1].split(/\r?\n/).map((line) => line.trim()));
    const hasPluginType = fields.has(`type: ${JSON.stringify("automatic-mood-entry")}`);
    const hasDate = fields.has(`date: ${JSON.stringify(date)}`);
    const hasOwnershipMarker = fields.has("automatic_mood_history: true");
    const isLegacyPluginEntry = hasPluginType && Array.from(fields).some((field) => field.startsWith("analysis_source: "));
    return hasDate && (hasOwnershipMarker || isLegacyPluginEntry);
  }

  async resolveEntryPath(record) {
    const defaultPath = `${this.entriesFolder}/${record.date}.md`;
    const storedPath = typeof record.entryPath === "string" &&
      record.entryPath.startsWith(`${this.entriesFolder}/`) ? record.entryPath : defaultPath;
    const existing = this.app.vault.getAbstractFileByPath(storedPath);
    if (!existing || await this.isOwnedEntry(existing, record.date)) return storedPath;

    for (let suffix = 1; suffix <= 1000; suffix += 1) {
      const label = suffix === 1 ? "" : " " + suffix;
      const candidate = `${this.entriesFolder}/${record.date} (Automatic Mood History${label}).md`;
      const candidateFile = this.app.vault.getAbstractFileByPath(candidate);
      if (!candidateFile || await this.isOwnedEntry(candidateFile, record.date)) return candidate;
    }
    throw new Error(`Could not find a safe entry filename for ${record.date}.`);
  }

  async ensureSupportFiles() {
    await this.ensureFolder(this.outputFolder);
    await this.ensureFolder(this.entriesFolder);
    const dashboard = `---\ntype: "mood-history-dashboard"\naliases:\n  - "Mood Tracker"\n---\n\n# Mood History\n\nThis dashboard groups every Markdown note by the local calendar day of its Obsidian creation timestamp, regardless of folder or filename. Generated Mood History files and the Obsidian trash folder are excluded. Scores are text inferences, not diagnoses.\n\n\`\`\`automatic-mood-history\n\`\`\`\n\n## All entries\n\n![[${this.outputFolder}/Mood History.base]]\n\n## How it works\n\n- [[${this.outputFolder}/Methodology|Methodology and scoring]]\n- Use the command **Automatic Mood History: Reanalyze all notes with Groq** to retry Groq or refresh every creation-date group.\n`;
    const base = `filters:\n  and:\n    - file.inFolder("${this.entriesFolder}")\n    - type == "automatic-mood-entry"\nproperties:\n  mood:\n    displayName: Mood\n  energy:\n    displayName: Energy\n  connection:\n    displayName: Connection\n  intensity:\n    displayName: Intensity\n  analysis_source:\n    displayName: Analyzer\nviews:\n  - type: table\n    name: Mood history\n    order:\n      - date\n      - mood\n      - energy\n      - connection\n      - intensity\n      - emotions\n      - confidence\n      - analysis_source\n      - source_notes\n`;
    const methodology = `---\ntype: "guide"\n---\n\n# Mood History methodology\n\n[[${this.outputFolder}/Mood History|Back to Mood History]]\n\n## Date grouping\n\nEvery Markdown note in the vault is grouped by the local calendar day of its Obsidian creation timestamp, TFile.stat.ctime. Folder, filename, frontmatter date, aliases, and later edits do not change the group. Generated Mood History files and notes in the Obsidian trash folder are excluded. Notes without a valid creation timestamp are skipped. Records created by earlier filename/frontmatter-based versions are preserved and labeled as legacy in the dashboard.\n\n## Scores\n\n- **Mood:** 1 strongly negative or severe distress; 3 mixed or neutral; 5 strongly positive.\n- **Energy:** 1 depleted or inert; 5 highly activated.\n- **Connection:** 1 isolated or unseen; 5 deeply connected or supported.\n- **Intensity:** 1 emotionally muted; 5 extremely forceful or emotionally charged.\n\n## Evidence rules\n\nThe analyzer consolidates all Markdown notes created on the same local date, removes duplicate paragraphs, and hashes the result. It runs again only when that day's source changes. Empty and image-only dates are recorded as insufficient evidence.\n\nThe prompt distinguishes the author's feelings from quoted text, abstract analysis, negation, and feelings attributed to other people. The result is still an inference. It is not a medical assessment or an objective fact.\n\n## Groq and fallback\n\nGroq is used when \`${this.settings.apiKeyEnvironmentVariable}\` is available and the API is reachable. The API key is read from the process environment and is never saved in this vault. If Groq cannot be reached, a deterministic local word-pattern fallback produces a low-confidence directional result. Every entry records its analyzer.\n`;
    await this.writeTextFile(this.dashboardPath, dashboard, false);
    await this.writeTextFile(`${this.outputFolder}/Mood History.base`, base, false);
    await this.writeTextFile(`${this.outputFolder}/Methodology.md`, methodology, false);
  }

  async openDashboard() {
    await this.ensureSupportFiles();
    const file = this.app.vault.getAbstractFileByPath(this.dashboardPath);
    if (!(file instanceof TFile)) return;
    const leaf = this.app.workspace.getLeaf(false);
    await leaf.openFile(file);
    await leaf.setViewState({ type: "markdown", state: { file: file.path, mode: "preview" } });
  }

  refreshRenderers() {
    for (const element of Array.from(this.renderContainers)) {
      if (!element.isConnected) this.renderContainers.delete(element);
      else this.renderDashboard(element);
    }
  }

  average(records, property) {
    const values = records.map((record) => record[property]).filter((value) => Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  renderDashboard(element) {
    element.empty();
    const wrapper = element.createDiv({ cls: "auto-mood-dashboard" });
    const records = Object.values(this.records).sort((a, b) => a.date.localeCompare(b.date));
    const timestampRecords = records.filter((record) => record.dateBasis === CREATED_DATE_BASIS);
    const complete = timestampRecords.filter((record) => record.status === "complete" && Number.isFinite(record.moodScore));

    const toolbar = wrapper.createDiv({ cls: "auto-mood-toolbar" });
    toolbar.createEl("strong", { text: "AUTOMATIC MOOD HISTORY" });
    const actions = toolbar.createDiv({ cls: "auto-mood-actions" });
    const changedButton = actions.createEl("button", { text: "Analyze changed" });
    changedButton.addEventListener("click", () => void this.analyzeAll({ force: false, forceGroq: false }));
    const groqButton = actions.createEl("button", { text: "Retry all with Groq" });
    groqButton.addEventListener("click", () => void this.analyzeAll({ force: true, forceGroq: true }));

    if (!records.length) {
      wrapper.createDiv({ cls: "auto-mood-empty", text: "No history yet. Run Analyze changed to build it." });
      return;
    }

    const cards = wrapper.createDiv({ cls: "auto-mood-cards" });
    const cardData = [
      ["DAYS SCORED", String(complete.length)],
      ["AVG MOOD", this.average(complete, "moodScore")?.toFixed(1) || "—"],
      ["AVG ENERGY", this.average(complete, "energyScore")?.toFixed(1) || "—"],
      ["AVG CONNECTION", this.average(complete, "connectionScore")?.toFixed(1) || "—"]
    ];
    for (const [label, value] of cardData) {
      const card = cards.createDiv({ cls: "auto-mood-card" });
      card.createDiv({ cls: "auto-mood-card-label", text: label });
      card.createDiv({ cls: "auto-mood-card-value", text: value });
    }

    if (complete.length) this.renderTrendChart(wrapper, complete);
    this.renderEmotionBars(wrapper, complete);
    this.renderHistoryTable(wrapper, records);

    const provenance = wrapper.createDiv({ cls: "auto-mood-provenance" });
    const groqCount = complete.filter((record) => record.analysisSource === "groq").length;
    const reviewedCount = complete.filter((record) => record.analysisSource === "reviewed-backfill").length;
    const fallbackCount = complete.filter((record) => record.analysisSource === "local-fallback").length;
    provenance.setText(`Timestamp groups: ${timestampRecords.length} · ${groqCount} Groq · ${reviewedCount} reviewed backfill · ${fallbackCount} local fallback · ${timestampRecords.length - complete.length} insufficient evidence. ${records.length - timestampRecords.length} previous-scope records are preserved and labeled legacy.`);
  }

  renderTrendChart(parent, records) {
    const section = parent.createDiv({ cls: "auto-mood-section" });
    section.createEl("h3", { text: "TREND" });
    const scroll = section.createDiv({ cls: "auto-mood-chart-scroll" });
    const width = Math.max(760, records.length * 66);
    const height = 310;
    const left = 46;
    const top = 26;
    const bottom = 52;
    const chartHeight = height - top - bottom;
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
    svg.setAttribute("width", String(width));
    svg.setAttribute("height", String(height));
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Mood, energy, and connection scores by date on a one-to-five scale");
    svg.classList.add("auto-mood-svg");
    scroll.appendChild(svg);

    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = "Mood, energy, and connection trend";
    svg.appendChild(title);

    const make = (name, attributes, text) => {
      const node = document.createElementNS("http://www.w3.org/2000/svg", name);
      for (const [key, value] of Object.entries(attributes || {})) node.setAttribute(key, String(value));
      if (text !== undefined) node.textContent = text;
      svg.appendChild(node);
      return node;
    };
    const x = (index) => left + index * ((width - left - 24) / Math.max(1, records.length - 1));
    const y = (score) => top + (5 - score) * (chartHeight / 4);

    for (let score = 1; score <= 5; score += 1) {
      make("line", { x1: left, y1: y(score), x2: width - 20, y2: y(score), class: "grid" });
      make("text", { x: 18, y: y(score) + 5, class: "axis-label" }, String(score));
    }
    const series = [
      ["Mood", "moodScore", "var(--amh-series-mood)", "none"],
      ["Energy", "energyScore", "var(--amh-series-energy)", "10 5"],
      ["Connection", "connectionScore", "var(--amh-series-connection)", "3 5"]
    ];
    for (const [label, property, color, dashArray] of series) {
      const points = records.map((record, index) => `${x(index)},${y(record[property])}`).join(" ");
      make("polyline", {
        points,
        fill: "none",
        stroke: color,
        "stroke-width": 5,
        "stroke-dasharray": dashArray,
        class: "series"
      });
      records.forEach((record, index) => make("circle", {
        cx: x(index), cy: y(record[property]), r: 5, fill: color, stroke: "var(--amh-chart-outline)", "stroke-width": 2
      }));
      const legendX = left + series.findIndex((item) => item[0] === label) * 150;
      make("rect", { x: legendX, y: height - 24, width: 18, height: 8, fill: color, stroke: "var(--amh-chart-outline)" });
      make("text", { x: legendX + 26, y: height - 15, class: "legend-label" }, label);
    }
    records.forEach((record, index) => {
      const label = record.date.slice(5);
      make("text", { x: x(index), y: height - 38, class: "date-label", transform: `rotate(-45 ${x(index)} ${height - 38})` }, label);
    });
  }

  renderEmotionBars(parent, records) {
    const counts = new Map();
    for (const record of records) {
      for (const emotion of record.emotions || []) counts.set(emotion, (counts.get(emotion) || 0) + 1);
    }
    const top = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8);
    if (!top.length) return;
    const section = parent.createDiv({ cls: "auto-mood-section" });
    section.createEl("h3", { text: "COMMON EMOTIONS" });
    const list = section.createDiv({ cls: "auto-mood-bars" });
    const max = top[0][1];
    for (const [emotion, count] of top) {
      const row = list.createDiv({ cls: "auto-mood-bar-row" });
      row.createDiv({ cls: "auto-mood-bar-label", text: emotion });
      const track = row.createDiv({ cls: "auto-mood-bar-track" });
      const bar = track.createDiv({ cls: "auto-mood-bar-fill" });
      bar.style.width = `${Math.max(8, (count / max) * 100)}%`;
      row.createDiv({ cls: "auto-mood-bar-count", text: String(count) });
    }
  }

  renderHistoryTable(parent, records) {
    const section = parent.createDiv({ cls: "auto-mood-section" });
    section.createEl("h3", { text: "DAY BY DAY" });
    const scroll = section.createDiv({ cls: "auto-mood-table-scroll" });
    const table = scroll.createEl("table");
    const head = table.createEl("thead").createEl("tr");
    for (const label of ["Date", "Date basis", "Mood", "Energy", "Connection", "Emotions", "Reading", "Analyzer"]) {
      head.createEl("th", { text: label });
    }
    const body = table.createEl("tbody");
    for (const record of [...records].reverse()) {
      const row = body.createEl("tr");
      const dateCell = row.createEl("td");
      const entryPath = String(record.entryPath || (this.entriesFolder + "/" + record.date + ".md")).replace(/[.]md$/i, "");
      const link = dateCell.createEl("a", { text: record.date, cls: "internal-link" });
      link.setAttribute("data-href", entryPath);
      link.setAttribute("href", entryPath);
      row.createEl("td", { text: record.dateBasis === CREATED_DATE_BASIS ? "Created timestamp" : "Legacy date" });
      if (record.status === "insufficient") {
        row.createEl("td", { text: "—", attr: { colspan: "3" } });
        row.createEl("td", { text: "—" });
        row.createEl("td", { text: record.summary });
        row.createEl("td", { text: "none" });
        continue;
  }
      const mood = row.createEl("td", { text: `${record.moodScore}/5` });
      mood.classList.add("auto-mood-score");
      mood.dataset.score = String(record.moodScore);
      row.createEl("td", { text: `${record.energyScore}/5` });
      row.createEl("td", { text: `${record.connectionScore}/5` });
      row.createEl("td", { text: (record.emotions || []).join(", ") });
      row.createEl("td", { text: record.summary || "" });
      row.createEl("td", { text: record.analysisSource });
    }
  }
}

class AutomaticMoodHistorySettingTab extends PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();
    containerEl.createEl("h2", { text: "Automatic Mood History" });
    containerEl.createEl("p", {
      text: "Every Markdown note is grouped by the local date of its Obsidian creation timestamp, regardless of folder or filename. Local analysis is the default. Groq is optional and off until enabled. Its key is read from GROQ_API_KEY in the Obsidian process environment and is never stored in this vault."
    });
    new Setting(containerEl)
      .setName("Enable Groq analysis")
      .setDesc("When enabled, analysis may send cleaned text from all notes created that date to Groq. This setting is off by default.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableGroq)
        .onChange(async (value) => {
          this.plugin.settings.enableGroq = value;
          if (!value) {
            this.plugin.lastGroqError = "";
            this.plugin.groqBlockedUntil = 0;
          }
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Groq model")
      .setDesc("A production model that supports chat completions.")
      .addText((text) => text
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value.trim() || DEFAULT_SETTINGS.model;
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Analyze note changes automatically")
      .setDesc("Reanalyze the note's creation-date group after any included note changes.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoAnalyze)
        .onChange(async (value) => {
          this.plugin.settings.autoAnalyze = value;
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Analyze on startup")
      .setDesc("Check all note creation-date groups after Obsidian starts. Unchanged source hashes are skipped.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.analyzeOnStartup)
        .onChange(async (value) => {
          this.plugin.settings.analyzeOnStartup = value;
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Analyze changed notes now")
      .addButton((button) => button.setButtonText("Run").setCta().onClick(() => {
        void this.plugin.analyzeAll({ force: false, forceGroq: false });
      }));
    new Setting(containerEl)
      .setName("Retry every creation-date group with Groq")
      .setDesc("Forces reanalysis and retries Groq even after a recent network error.")
      .addButton((button) => button.setButtonText("Retry Groq").onClick(() => {
        void this.plugin.retryAllWithGroq();
      }));
  }
}

module.exports = AutomaticMoodHistoryPlugin;
