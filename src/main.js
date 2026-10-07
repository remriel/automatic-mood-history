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

const {
  ANALYSIS_SCHEMA,
  buildEntryMarkdown,
  deduplicateParagraphs,
  localSentiment,
  sha256,
  textForAnalysis,
  validateAnalysis
} = require("./sentiment-core");

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
    if (!this.runtime.lastGroqIssue) delete this.runtime.lastGroqError;
    this.runtime.lastLoadedAt = new Date().toISOString();
    this.runtime.version = this.manifest.version;
    this.runtime.apiKeyDetected = Boolean(globalThis.process?.env?.[GROQ_API_KEY_ENV]);
    this.runtime.lastLoadStatus = "loaded";
    this.debounceTimers = new Map();
    this.renderContainers = new Set();
    this.chartObservers = new Map();
    const savedRetryAt = Date.parse(this.runtime.nextGroqRetryAt || "");
    this.groqBlockedUntil = Number.isFinite(savedRetryAt) ? savedRetryAt : 0;
    this.lastGroqError = this.runtime.lastGroqIssue?.message || "";
    this.analysisQueue = Promise.resolve();

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
      id: "check-groq-connection",
      name: "Check Groq connection with sample text",
      callback: () => this.checkGroqConnection()
    });
    this.addCommand({
      id: "recover-fallback-entries",
      name: "Retry fallback entries with Groq",
      callback: () => this.recoverFallbacksWithGroq()
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
      child.onunload = () => {
        this.disposeDashboard(element);
        this.renderContainers.delete(element);
      };
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
    this.disposeDashboard();
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
    return this.gatherFiles(date, this.filesForDate(date));
  }

  async gatherLegacyDate(date) {
    const previous = this.records[date];
    const paths = Array.from(new Set(previous?.sourcePaths || []));
    if (!paths.length || previous.dateBasis !== LEGACY_DATE_BASIS) return null;
    const files = paths.map((path) => typeof path === "string" ? this.app.vault.getAbstractFileByPath(path) : null);
    // Never substitute unrelated creation-date notes or silently score a
    // partial set when a legacy record's original sources are unavailable.
    if (files.some((file) => !this.getCreationDateForFile(file))) return null;
    return this.gatherFiles(date, files.sort((a, b) => a.path.localeCompare(b.path)));
  }

  async gatherFiles(date, files) {
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

  fallbackRecords() {
    return Object.values(this.records || {}).filter((record) => record.status === "complete" && record.analysisSource === "local-fallback");
  }

  legacyRecords() {
    return Object.values(this.records || {}).filter((record) => record.dateBasis === LEGACY_DATE_BASIS);
  }

  getAnalysisTargets(options = {}) {
    const targets = new Map();
    if (!options.onlyFallbacks) {
      for (const date of this.getAllDates()) targets.set(date, { date, legacySources: false });
    }
    if (this.settings.enableGroq && this.apiKey()) {
      const recordsToRetry = options.onlyFallbacks ? this.fallbackRecords() : this.legacyRecords();
      for (const record of recordsToRetry) {
        // Retain the original legacy source set and date even if a current
        // creation-date group happens to use the same date key.
        targets.set(record.date, { date: record.date, legacySources: record.dateBasis === LEGACY_DATE_BASIS });
      }
    }
    return Array.from(targets.values()).sort((a, b) => a.date.localeCompare(b.date));
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
    let json;
    try { json = response.json; } catch { json = null; }
    if (response.status < 200 || response.status >= 300) {
      // Error bodies can include generated note text or account identifiers.
      // Keep provider status and safe error codes, never the response body.
      const code = String(json?.error?.code || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 80);
      const error = new Error(`Groq HTTP ${response.status}${code ? ` (${code})` : ""}.`);
      error.status = response.status;
      const headers = Object.fromEntries(Object.entries(response.headers || {}).map(([key, value]) => [key.toLowerCase(), value]));
      const retryAfter = headers["retry-after"];
      const seconds = Number(retryAfter);
      const delay = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
      if (retryAfter && Number.isFinite(delay) && delay > 0) error.retryAfterMilliseconds = delay;
      throw error;
    }
    return json;
  }

  clearGroqPause() {
    this.groqBlockedUntil = 0;
    this.lastGroqError = "";
    this.runtime.lastGroqError = "";
    delete this.runtime.lastGroqIssue;
    delete this.runtime.nextGroqRetryAt;
  }

  recordGroqSuccess() {
    this.clearGroqPause();
    this.runtime.lastGroqSuccessAt = new Date().toISOString();
    this.runtime.lastGroqModel = this.settings.model;
  }

  recordGroqFailure(error) {
    const status = error.status;
    let kind = "connection";
    let message = "Groq could not be reached.";
    let delay = 60 * 1000;
    if (error.code === "missing_key") {
      kind = "configuration";
      message = "Obsidian has no GROQ_API_KEY in its environment.";
      delay = 5 * 60 * 1000;
    } else if (status === 401 || status === 403) {
      kind = "authentication";
      message = `Groq rejected the API key or access (HTTP ${status}).`;
      delay = 5 * 60 * 1000;
    } else if (status === 429) {
      kind = "rate-limit";
      delay = error.retryAfterMilliseconds || delay;
      message = "Groq reached its rate limit (HTTP 429). Retry after the pause.";
    } else if (status === 400 || status === 404 || status === 413) {
      kind = "request";
      message = `Groq rejected this model or request (HTTP ${status}). Check the selected model.`;
      delay = 5 * 60 * 1000;
    } else if (status === 422) {
      kind = "output";
      message = "Groq returned incomplete or invalid analysis.";
    } else if (status >= 500) {
      kind = "service";
      message = `Groq returned a service error (HTTP ${status}).`;
    }
    const retryAt = new Date(Date.now() + delay).toISOString();
    const issue = { kind, message, retryAt };
    this.groqBlockedUntil = Date.parse(retryAt);
    this.lastGroqError = message;
    this.runtime.lastGroqError = message;
    this.runtime.lastGroqIssue = issue;
    this.runtime.nextGroqRetryAt = retryAt;
    this.runtime.lastGroqFailureAt = new Date().toISOString();
    return issue;
  }

  parseGroqAnalysis(response) {
    const choice = response?.choices?.[0];
    if (choice?.finish_reason === "length") {
      const error = new Error("Groq reached the completion limit before finishing the analysis.");
      error.code = "completion_limit";
      throw error;
    }
    const raw = choice?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) throw new Error("Groq returned no analysis content.");
    // Do not accept JSON in a reasoning section as a final answer.
    const finalText = raw.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
    const start = finalText.indexOf("{");
    const end = finalText.lastIndexOf("}");
    if (start < 0 || end <= start) throw new Error("Groq returned no JSON object.");
    const parsed = JSON.parse(finalText.slice(start, end + 1));
    if (!parsed || Array.isArray(parsed) || ANALYSIS_SCHEMA.required.some((key) => !Object.hasOwn(parsed, key))) {
      throw new Error("Groq omitted required analysis fields.");
    }
    for (const key of ["moodScore", "energyScore", "connectionScore", "intensityScore"]) {
      if (!Number.isInteger(parsed[key]) || parsed[key] < 1 || parsed[key] > 5) throw new Error("Groq returned an invalid score.");
    }
    if (!Array.isArray(parsed.emotions) || !parsed.emotions.length ||
      parsed.emotions.some((value) => !ANALYSIS_SCHEMA.properties.emotions.items.enum.includes(value)) ||
      !Array.isArray(parsed.drivers) || !parsed.drivers.length || parsed.drivers.some((value) => typeof value !== "string") ||
      typeof parsed.summary !== "string" || !parsed.summary.trim() ||
      typeof parsed.confidenceReason !== "string" || !parsed.confidenceReason.trim() ||
      !ANALYSIS_SCHEMA.properties.valence.enum.includes(parsed.valence) ||
      !ANALYSIS_SCHEMA.properties.confidence.enum.includes(parsed.confidence)) {
      throw new Error("Groq returned invalid analysis fields.");
    }
    return validateAnalysis(parsed);
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

  async analyzeWithGroq(date, text, options = {}) {
    if (!this.apiKey()) {
      const error = new Error(`Environment variable ${GROQ_API_KEY_ENV} is missing.`);
      error.code = "missing_key";
      throw error;
    }
    if (!options.forceGroq && Date.now() < this.groqBlockedUntil) throw new Error(this.lastGroqError || "Groq retry is temporarily paused.");

    const schemaInstruction = `Return one JSON object matching this schema exactly: ${JSON.stringify(ANALYSIS_SCHEMA)}. Use distinct emotions. Output raw JSON only, with no Markdown fence, preface, or explanation.`;
    const base = {
      model: this.settings.model,
      messages: [
        {
          role: "system",
          content: `You are a precise journal sentiment analyst. Never infer a diagnosis. ${schemaInstruction}`
        },
        { role: "user", content: this.groqPrompt(date, text) }
      ],
      temperature: 0.1,
      max_completion_tokens: 4096
    };
    if (/^openai\/gpt-oss-(20b|120b)$/.test(this.settings.model)) {
      base.reasoning_effort = "low";
      base.include_reasoning = false;
    }
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
          response_format: { type: "json_object" }
        }
      },
      {
        name: "plain JSON fallback",
        payload: {
          ...base,
        }
      }
    ];

    const failures = [];
    let retriedCompletionLimit = false;
    for (const attempt of attempts) {
      try {
        try {
          return this.parseGroqAnalysis(await this.requestGroq(attempt.payload));
        } catch (error) {
          if (error.code !== "completion_limit" || retriedCompletionLimit) throw error;
          retriedCompletionLimit = true;
          return this.parseGroqAnalysis(await this.requestGroq({ ...attempt.payload, max_completion_tokens: 8192 }));
        }
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
    // Serialize scans, active-note commands, and debounced note events.
    const task = (this.analysisQueue || Promise.resolve()).then(() => this.analyzeDateNow(date, options));
    this.analysisQueue = task.catch(() => {});
    return task;
  }

  async analyzeDateNow(date, options = {}) {
    const previous = this.records[date];
    const recovering = Boolean(options.onlyFallbacks || options.legacySources);
    const dateBasis = options.legacySources ? LEGACY_DATE_BASIS : CREATED_DATE_BASIS;
    const skipRecovery = (pending = false) => {
      if (options.runStats) {
        options.runStats.skipped += 1;
        if (pending) options.runStats.pending += 1;
      }
      return false;
    };
    if (recovering && (!this.settings.enableGroq || !this.apiKey() || !options.forceGroq && Date.now() < this.groqBlockedUntil)) {
      const needsGroq = options.force || !previous || previous.status === "complete" && previous.analysisSource !== "groq";
      return skipRecovery(Boolean(this.settings.enableGroq && needsGroq && (!this.apiKey() || !options.forceGroq && Date.now() < this.groqBlockedUntil)));
    }
    const gathered = options.legacySources ? await this.gatherLegacyDate(date) : await this.gatherDate(date);
    if (!gathered || recovering && gathered.analysisText.length < this.settings.minimumCharacters) {
      return skipRecovery(Boolean(recovering && this.settings.enableGroq && previous?.status === "complete" && previous.analysisSource !== "groq"));
    }
    const retryNonGroqResult = this.settings.enableGroq && previous?.status === "complete" && previous?.analysisSource !== "groq" &&
      (dateBasis === LEGACY_DATE_BASIS || ["local", "local-fallback"].includes(previous?.analysisSource)) &&
      (options.forceGroq || Date.now() >= this.groqBlockedUntil);
    const pendingDuringPause = this.settings.enableGroq && !options.forceGroq && Date.now() < this.groqBlockedUntil &&
      (options.force || previous?.contentHash !== gathered.contentHash || previous?.dateBasis !== dateBasis || previous?.status === "complete" && previous?.analysisSource !== "groq");
    if (pendingDuringPause) {
      if (options.runStats) options.runStats.pending += 1;
      return false;
    }
    if (!options.force && !retryNonGroqResult && previous?.contentHash === gathered.contentHash) {
      if (previous.dateBasis === dateBasis) return false;
      previous.dateBasis = dateBasis;
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
      if (this.settings.enableGroq && !canTryGroq) {
        if (options.runStats) options.runStats.pending += 1;
        return false;
      }
      if (canTryGroq) {
        try {
          analysis = await this.analyzeWithGroq(date, gathered.analysisText, options);
          analysisSource = "groq";
          model = this.settings.model;
          this.recordGroqSuccess();
        } catch (error) {
          this.recordGroqFailure(error);
          if (options.runStats) {
            options.runStats.failures += 1;
            options.runStats.pending += 1;
          }
          // Groq-enabled mode is provider-only. Keep a saved result as-is and
          // leave new/changed groups pending instead of silently scoring local.
          await this.savePluginData();
          this.refreshRenderers();
          return false;
        }
      } else {
        analysis = localSentiment(gathered.analysisText, gathered.topic);
        analysisSource = "local";
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
      dateBasis,
      contentHash: gathered.contentHash,
      sourcePaths: gathered.sourcePaths,
      analyzedAt: new Date().toISOString(),
      ...(previous?.entryPath ? { entryPath: previous.entryPath } : {})
    });
    await this.writeEntryNote(record);
    this.records[date] = record;
    await this.savePluginData();
    this.refreshRenderers();
    if (options.runStats) {
      options.runStats[record.status === "insufficient" ? "insufficient" : record.analysisSource === "groq" ? "groq" : record.analysisSource === "local" ? "local" : "fallback"] += 1;
    }
    return true;
  }

  async analyzeAll(options = {}) {
    if (this.checkingGroq) {
      new Notice("Automatic Mood History: wait for the Groq connection check to finish.");
      return;
    }
    if (this.activeScan) {
      new Notice("Automatic Mood History: an analysis is already running.");
      return this.activeScan;
    }
    const task = this.analyzeAllNow(options);
    this.activeScan = task;
    this.refreshRenderers();
    try { return await task; } finally {
      this.activeScan = null;
      this.refreshRenderers();
    }
  }

  async analyzeAllNow(options) {
    // An explicit retry bypasses an old pause once. A new rate limit pauses
    // the remaining dates in the same run instead of hammering the provider.
    if (options.forceGroq) this.clearGroqPause();
    const runStats = { groq: 0, local: 0, fallback: 0, insufficient: 0, failures: 0, pending: 0, skipped: 0 };
    const dateOptions = { ...options, forceGroq: false, runStats };
    const targets = this.getAnalysisTargets(options);
    new Notice(`Automatic Mood History: checking ${targets.length} history groups (${targets.filter((target) => target.legacySources).length} saved legacy sources)…`);
    let changed = 0;
    for (const target of targets) {
      if (await this.analyzeDate(target.date, { ...dateOptions, legacySources: target.legacySources })) changed += 1;
    }
    await this.ensureSupportFiles();
    await this.savePluginData();
    const suffix = runStats.pending ? ` ${runStats.pending} groups remain pending Groq; existing results were kept. ${this.runtime.lastGroqIssue?.message || "Groq retries are paused."}` : runStats.groq ? ` ${runStats.groq} used Groq.` : "";
    const pendingFallbacks = this.fallbackRecords().length;
    const pending = this.settings.enableGroq && pendingFallbacks ? ` ${pendingFallbacks} saved local-fallback entries still await a successful Groq result.` : "";
    new Notice(`Automatic Mood History: ${changed} history groups updated.${suffix}${pending}`, 9000);
    return { updated: changed, ...runStats, pendingFallbacks };
  }

  async checkGroqConnection() {
    if (!this.settings.enableGroq) {
      new Notice("Automatic Mood History: enable Groq analysis in settings before checking the connection.");
      return false;
    }
    if (this.activeScan || this.checkingGroq) {
      new Notice("Automatic Mood History: wait for the current analysis or connection check to finish.");
      return false;
    }
    this.checkingGroq = true;
    this.refreshRenderers();
    new Notice("Automatic Mood History: checking Groq with sample text…");
    try {
      await this.analyzeWithGroq("2030-03-14", "This is a fictional connection-check sample. The writer feels calm, hopeful, and supported after a friendly conversation.", { forceGroq: true });
      this.recordGroqSuccess();
      new Notice("Automatic Mood History: Groq connection works. No vault notes were sent.");
      return true;
    } catch (error) {
      const issue = this.recordGroqFailure(error);
      new Notice(`Automatic Mood History: connection check failed. ${issue.message}`, 9000);
      return false;
    } finally {
      this.checkingGroq = false;
      await this.savePluginData();
      this.refreshRenderers();
    }
  }

  async retryAllWithGroq() {
    if (!this.settings.enableGroq) {
      new Notice("Automatic Mood History: enable Groq analysis in settings before using this command.");
      return;
    }
    await this.analyzeAll({ force: true, forceGroq: true });
  }

  async recoverFallbacksWithGroq() {
    if (!this.settings.enableGroq || !this.apiKey()) {
      new Notice("Automatic Mood History: enable Groq analysis and start Obsidian with GROQ_API_KEY before retrying fallbacks.");
      return;
    }
    return this.analyzeAll({ onlyFallbacks: true, forceGroq: true });
  }

  groqStatus() {
    if (!this.settings.enableGroq) return { kind: "local", text: "LOCAL MODE · Groq is disabled. Analysis stays on this device." };
    if (!this.apiKey()) return { kind: "warning", text: "GROQ KEY MISSING · Start Obsidian with GROQ_API_KEY in its environment." };
    if (this.checkingGroq) return { kind: "ready", text: "CHECKING GROQ · Sending fictional sample text." };
    if (this.activeScan) return { kind: "ready", text: "ANALYZING · Notes are grouped by their creation timestamps." };
    const issue = this.runtime.lastGroqIssue;
    if (issue) {
      const remaining = Math.max(0, Math.ceil((this.groqBlockedUntil - Date.now()) / 1000));
      return { kind: "warning", text: `${issue.message}${remaining ? ` Retry pause: ${remaining}s; Groq-enabled analysis stays pending.` : " Run Analyze changed to retry with Groq."}` };
    }
    if (this.runtime.lastGroqSuccessAt && this.runtime.lastGroqModel === this.settings.model) {
      const pending = this.fallbackRecords().length;
      return { kind: "ready", text: `GROQ CONNECTED · ${this.settings.model} · Last valid response ${new Date(this.runtime.lastGroqSuccessAt).toLocaleString()}.${pending ? ` ${pending} saved fallback entries await reanalysis. Use Retry fallback entries.` : ""}` };
    }
    return { kind: "ready", text: `GROQ READY TO CHECK · ${this.settings.model} · Use Check Groq to test with sample text.` };
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
    const dashboard = `---\ntype: "mood-history-dashboard"\naliases:\n  - "Mood Tracker"\n---\n\n# Mood History\n\nThis dashboard groups every Markdown note by the local calendar day of its Obsidian creation timestamp, regardless of folder or filename. Generated Mood History files and the Obsidian trash folder are excluded. Scores are text inferences, not diagnoses.\n\n\`\`\`automatic-mood-history\n\`\`\`\n\n## Optional Base view\n\n[[${this.outputFolder}/Mood History.base|Open the optional Base table]]\n\nThe complete history is shown above without horizontal scrolling. The separate native Base is available for custom table views.\n\n## How it works\n\n- [[${this.outputFolder}/Methodology|Methodology and scoring]]\n- Use the command **Automatic Mood History: Reanalyze all notes with Groq** to retry Groq or refresh every creation-date group.\n`;
    const base = `filters:\n  and:\n    - file.inFolder("${this.entriesFolder}")\n    - type == "automatic-mood-entry"\nproperties:\n  mood:\n    displayName: Mood\n  energy:\n    displayName: Energy\n  connection:\n    displayName: Connection\n  intensity:\n    displayName: Intensity\n  analysis_source:\n    displayName: Analyzer\nviews:\n  - type: table\n    name: Mood history\n    order:\n      - date\n      - mood\n      - energy\n      - connection\n      - intensity\n      - emotions\n      - confidence\n      - analysis_source\n      - source_notes\n`;
const methodology = `---\ntype: "guide"\n---\n\n# Mood History methodology\n\n[[${this.outputFolder}/Mood History|Back to Mood History]]\n\n## Date grouping\n\nEvery Markdown note in the vault is grouped by the local calendar day of its Obsidian creation timestamp, TFile.stat.ctime. Folder, filename, frontmatter date, aliases, and later edits do not change the group. Generated Mood History files and notes in the Obsidian trash folder are excluded. Notes without a valid creation timestamp are skipped. Records created by earlier filename/frontmatter-based versions are preserved and labeled as legacy in the dashboard. Legacy records are retried with their original saved source notes, while keeping their legacy date.\n\n## Scores\n\n- **Mood:** 1 strongly negative or severe distress; 3 mixed or neutral; 5 strongly positive.\n- **Energy:** 1 depleted or inert; 5 highly activated.\n- **Connection:** 1 isolated or unseen; 5 deeply connected or supported.\n- **Intensity:** 1 emotionally muted; 5 extremely forceful or emotionally charged.\n\n## Evidence rules\n\nThe analyzer consolidates all Markdown notes created on the same local date, removes duplicate paragraphs, and hashes the result. It runs again only when that day's source changes. Empty and image-only dates are recorded as insufficient evidence.\n\nThe prompt distinguishes the author's feelings from quoted text, abstract analysis, negation, and feelings attributed to other people. The result is still an inference. It is not a medical assessment or an objective fact.\n\n## Groq and fallback\n\nWhen Groq is enabled, eligible text is analyzed only with Groq. If Groq is unavailable, paused, or returns an unusable response, existing records are preserved and new or changed groups remain pending for Groq. Local word-pattern scoring is used only when Groq is disabled. The API key is read from the process environment and is never saved in this vault. Every completed entry records its analyzer.\n`;
    await this.writeTextFile(this.dashboardPath, dashboard, false);
    await this.upgradeDashboardLayout();
    await this.writeTextFile(`${this.outputFolder}/Mood History.base`, base, false);
    await this.writeTextFile(`${this.outputFolder}/Methodology.md`, methodology, false);
  }

  async upgradeDashboardLayout() {
    const file = this.app.vault.getAbstractFileByPath(this.dashboardPath);
    if (!(file instanceof TFile)) return;
    const embed = `![[${this.outputFolder}/Mood History.base]]`;
    const isOwnedDashboard = (text) => {
      const frontmatter = text.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
      return Boolean(frontmatter && /^type:\s*["']?mood-history-dashboard["']?\s*$/m.test(frontmatter[1]));
    };
    const content = await this.app.vault.cachedRead(file);
    if (!isOwnedDashboard(content) || !content.includes(embed)) return;
    // Only migrate this exact plugin-created embed. Atomic processing keeps
    // concurrent edits and every other line of the dashboard intact.
    await this.app.vault.process(file, (current) => {
      if (!isOwnedDashboard(current)) return current;
      return current.replace(embed, `[[${this.outputFolder}/Mood History.base|Open the optional Base table]]\n\nThe complete history is shown above without horizontal scrolling. The separate native Base is available for custom table views.`);
    });
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
      if (!element.isConnected) {
        this.disposeDashboard(element);
        this.renderContainers.delete(element);
      }
      else this.renderDashboard(element);
    }
  }

  disposeDashboard(element) {
    for (const [svg, observer] of this.chartObservers || []) {
      if (!element || !svg.isConnected || element.contains(svg)) {
        observer.disconnect();
        this.chartObservers.delete(svg);
      }
    }
  }

  average(records, property) {
    const values = records.map((record) => record[property]).filter((value) => Number.isFinite(value));
    return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
  }

  renderDashboard(element) {
    this.disposeDashboard(element);
    element.empty();
    element.classList.add("auto-mood-render-root");
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
    groqButton.addEventListener("click", () => void this.retryAllWithGroq());
    const checkButton = actions.createEl("button", { text: "Check Groq" });
    checkButton.addEventListener("click", () => void this.checkGroqConnection());
    const fallbackButton = actions.createEl("button", { text: "Retry fallback entries" });
    fallbackButton.addEventListener("click", () => void this.recoverFallbacksWithGroq());
    groqButton.disabled = checkButton.disabled = !this.settings.enableGroq || Boolean(this.activeScan) || Boolean(this.checkingGroq);
    fallbackButton.disabled = groqButton.disabled || !this.fallbackRecords().length;
    changedButton.disabled = Boolean(this.activeScan) || Boolean(this.checkingGroq);
    const status = this.groqStatus();
    const statusElement = wrapper.createDiv({ cls: "auto-mood-provider-status", text: status.text });
    statusElement.dataset.kind = status.kind;
    statusElement.setAttribute("role", "status");

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
    this.renderHistoryCards(wrapper, records);

    const provenance = wrapper.createDiv({ cls: "auto-mood-provenance" });
    const groqCount = complete.filter((record) => record.analysisSource === "groq").length;
    const reviewedCount = complete.filter((record) => record.analysisSource === "reviewed-backfill").length;
    const fallbackCount = complete.filter((record) => record.analysisSource === "local-fallback").length;
    const localCount = complete.filter((record) => record.analysisSource === "local").length;
    const legacyFallbackCount = records.filter((record) => record.dateBasis === LEGACY_DATE_BASIS && record.analysisSource === "local-fallback").length;
    provenance.setText(`Timestamp groups: ${timestampRecords.length} · ${groqCount} Groq · ${localCount} local · ${reviewedCount} reviewed backfill · ${fallbackCount} local fallback · ${timestampRecords.length - complete.length} insufficient evidence. ${records.length - timestampRecords.length} previous-scope records are preserved and labeled legacy.${legacyFallbackCount ? ` ${legacyFallbackCount} legacy fallback entries can be recovered with Retry fallback entries.` : ""}`);
  }

  renderTrendChart(parent, records) {
    const section = parent.createDiv({ cls: "auto-mood-section" });
    section.createEl("h3", { text: "TREND" });
    section.createEl("p", { cls: "auto-mood-chart-range", text: `${records[0].date} to ${records[records.length - 1].date} · creation-date groups · scores 1–5` });
    const chart = section.createDiv({ cls: "auto-mood-chart" });
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "260");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", "Mood, energy, connection, and intensity scores by date on a one-to-five scale");
    svg.classList.add("auto-mood-svg");
    chart.appendChild(svg);
    const series = [
      ["Mood", "moodScore", "var(--amh-series-mood)", "none"],
      ["Energy", "energyScore", "var(--amh-series-energy)", "10 5"],
      ["Connection", "connectionScore", "var(--amh-series-connection)", "3 5"],
      ["Intensity", "intensityScore", "var(--amh-series-intensity)", "12 4 3 4"]
    ];
    const legend = section.createEl("ul", { cls: "auto-mood-chart-legend", attr: { "aria-label": "Chart series" } });
    for (const [label, , color, dashArray] of series) {
      const item = legend.createEl("li");
      const swatch = item.createEl("span", { cls: "auto-mood-legend-swatch", attr: { "aria-hidden": "true" } });
      swatch.style.borderTopColor = color;
      swatch.style.borderTopStyle = dashArray === "none" ? "solid" : label === "Connection" ? "dotted" : "dashed";
      swatch.dataset.series = label.toLowerCase();
      item.createEl("span", { text: label });
    }

    let previousWidth = 0;
    const draw = (availableWidth) => {
      const width = Math.max(1, Math.floor(availableWidth));
      if (width === previousWidth) return;
      previousWidth = width;
      const height = 260;
      const left = 32;
      const right = 14;
      const top = 20;
      const plotWidth = Math.max(1, width - left - right);
      const chartHeight = height - top - 38;
      svg.replaceChildren();
      svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
      const make = (name, attributes, text, target = svg) => {
        const node = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const [key, value] of Object.entries(attributes || {})) node.setAttribute(key, String(value));
        if (text !== undefined) node.textContent = text;
        target.appendChild(node);
        return node;
      };
      make("title", {}, "Mood, energy, connection, and intensity trend. Full daily values are listed below.");
      const x = (index) => left + (records.length === 1 ? plotWidth / 2 : index * plotWidth / (records.length - 1));
      const y = (score) => top + (5 - score) * (chartHeight / 4);
      for (let score = 1; score <= 5; score += 1) {
        make("line", { x1: left, y1: y(score), x2: width - right, y2: y(score), class: "grid" });
        make("text", { x: 12, y: y(score) + 4, class: "axis-label" }, String(score));
      }
      for (const [label, property, color, dashArray] of series) {
        const valid = records.map((record, index) => ({ record, index })).filter(({ record }) => Number.isFinite(record[property]));
        make("polyline", { points: valid.map(({ record, index }) => `${x(index)},${y(record[property])}`).join(" "), fill: "none", stroke: color, "stroke-width": 2.5, "stroke-dasharray": dashArray, class: "series", "data-series": property, "vector-effect": "non-scaling-stroke" });
        for (const { record, index } of valid) {
          const point = make("circle", { cx: x(index), cy: y(record[property]), r: 3.5, fill: color, stroke: "var(--amh-chart-outline)", "stroke-width": 1.5, "data-series": property });
          make("title", {}, `${record.date}: ${label} ${record[property]}/5`, point);
        }
      }
      // Keep every data point, but limit date labels to the actual pane width.
      // Redrawing in CSS-pixel coordinates keeps text legible rather than
      // shrinking a desktop-sized SVG into a narrow pane.
      const labelCount = Math.min(records.length, Math.max(2, Math.floor(plotWidth / 80)));
      const indices = new Set(Array.from({ length: labelCount }, (_, i) => labelCount === 1 ? 0 : Math.round(i * (records.length - 1) / (labelCount - 1))));
      for (const index of indices) {
        make("text", { x: x(index), y: height - 10, class: "date-label", "text-anchor": records.length === 1 ? "middle" : index === 0 ? "start" : index === records.length - 1 ? "end" : "middle" }, records[index].date.slice(5));
      }
    };
    draw(chart.clientWidth || 640);
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (width > 0) draw(width);
      });
      observer.observe(chart);
      this.chartObservers ||= new Map();
      this.chartObservers.set(svg, observer);
    }
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

  renderHistoryCards(parent, records) {
    const section = parent.createDiv({ cls: "auto-mood-section" });
    section.createEl("h3", { text: "DAY BY DAY" });
    const list = section.createDiv({ cls: "auto-mood-history-list" });
    for (const record of [...records].reverse()) {
      const card = list.createEl("article", { cls: "auto-mood-day", attr: { "aria-label": `Mood history for ${record.date}` } });
      const header = card.createDiv({ cls: "auto-mood-day-header" });
      const heading = header.createEl("h4", { cls: "auto-mood-day-date" });
      const entryPath = String(record.entryPath || (this.entriesFolder + "/" + record.date + ".md")).replace(/[.]md$/i, "");
      const link = heading.createEl("a", { text: record.date, cls: "internal-link", attr: { "aria-label": `Open mood entry for ${record.date}` } });
      link.setAttribute("data-href", entryPath);
      link.setAttribute("href", entryPath);
      const badges = header.createDiv({ cls: "auto-mood-day-badges" });
      badges.createEl("span", { cls: "auto-mood-badge", text: record.dateBasis === CREATED_DATE_BASIS ? "Created timestamp" : "Legacy date" });
      const analyzer = badges.createEl("span", { cls: "auto-mood-badge", text: record.analysisSource || "none" });
      if (record.providerIssue?.message) analyzer.setAttribute("title", record.providerIssue.message);
      if (record.status === "insufficient") {
        card.createEl("p", { cls: "auto-mood-insufficient", text: "Insufficient evidence · no scores assigned" });
        card.createEl("p", { cls: "auto-mood-day-reading", text: record.summary || "No readable text was available for this date." });
        continue;
      }
      const scores = card.createEl("dl", { cls: "auto-mood-day-scores" });
      for (const [label, property] of [["Mood", "moodScore"], ["Energy", "energyScore"], ["Connection", "connectionScore"], ["Intensity", "intensityScore"]]) {
        const metric = scores.createDiv({ cls: "auto-mood-day-metric" });
        metric.createEl("dt", { text: label });
        const value = metric.createEl("dd", { text: Number.isFinite(record[property]) ? `${record[property]}/5` : "—" });
        if (property === "moodScore" && Number.isFinite(record[property])) {
          value.classList.add("auto-mood-score");
          value.dataset.score = String(record[property]);
        }
      }
      const emotions = card.createDiv({ cls: "auto-mood-day-emotions", attr: { "aria-label": "Emotions" } });
      for (const emotion of record.emotions || []) emotions.createEl("span", { cls: "auto-mood-emotion", text: emotion });
      card.createEl("p", { cls: "auto-mood-day-reading", text: record.summary || "No summary available." });
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
    containerEl.classList.add("auto-mood-settings");
    containerEl.createEl("h2", { text: "Automatic Mood History" });
    containerEl.createEl("p", {
      text: "Every Markdown note is grouped by the local date of its Obsidian creation timestamp, regardless of folder or filename. Local analysis is the default. When Groq is enabled, eligible analysis uses Groq only; failed or paused requests stay pending instead of switching to local scoring. Its key is read from GROQ_API_KEY in the Obsidian process environment and is never stored in this vault."
    });
    new Setting(containerEl)
      .setName("Enable Groq analysis")
      .setDesc("When enabled, eligible analysis sends cleaned text from all notes created that date to Groq only. If Groq is unavailable or paused, the plugin keeps existing results and leaves new work pending. This setting is off by default.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.enableGroq)
        .onChange(async (value) => {
          this.plugin.settings.enableGroq = value;
          this.plugin.clearGroqPause();
          await this.plugin.savePluginData();
          this.plugin.refreshRenderers();
        }));
    new Setting(containerEl)
      .setName("Groq model")
      .setDesc("A production model that supports chat completions.")
      .addText((text) => text
        .setValue(this.plugin.settings.model)
        .onChange(async (value) => {
          this.plugin.settings.model = value.trim() || DEFAULT_SETTINGS.model;
          this.plugin.clearGroqPause();
          await this.plugin.savePluginData();
          this.plugin.refreshRenderers();
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
    new Setting(containerEl)
      .setName("Retry fallback entries with Groq")
      .setDesc("Retry only saved local-fallback results, including legacy entries using their original source notes. Successful Groq results are not rerun; missing sources and failed retries keep the existing result.")
      .addButton((button) => button.setButtonText("Retry fallbacks").onClick(() => {
        void this.plugin.recoverFallbacksWithGroq();
      }));
  }
}

module.exports = AutomaticMoodHistoryPlugin;
