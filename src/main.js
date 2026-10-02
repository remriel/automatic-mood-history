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

const DEFAULT_SETTINGS = {
  dailyFolder: "Daily",
  includeOutsideDailyFolder: false,
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
    this.records = loaded.records || {};
    for (const record of Object.values(this.records)) {
      if (record?.analysisSource === "assistant-backfill") record.analysisSource = "reviewed-backfill";
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
      name: "Analyze changed daily notes",
      callback: () => this.analyzeAll({ force: false, forceGroq: false })
    });
    this.addCommand({
      id: "reanalyze-all-with-groq",
      name: "Reanalyze all daily notes with Groq",
      callback: () => this.retryAllWithGroq()
    });
    this.addCommand({
      id: "analyze-active-note",
      name: "Analyze the active dated note",
      callback: async () => {
        const file = this.app.workspace.getActiveFile();
        const date = file ? this.getDateForFile(file) : null;
        if (!date) {
          new Notice("Automatic Mood History: the active note has no recognizable date.");
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
      this.handleSourceEvent(file);
      const oldDate = this.dateFromPath(oldPath);
      if (oldDate) this.scheduleDate(oldDate);
    }));
  }

  get outputFolder() {
    return this.settings.outputFolder.replace(/^\/+|\/+$/g, "");
  }

  isInDailyFolder(path) {
    const folder = String(this.settings.dailyFolder || "Daily").replace(/^\/+|\/+$/g, "");
    const normalizedPath = String(path || "").replace(/^\/+/, "");
    return folder ? normalizedPath.startsWith(folder + "/") : !normalizedPath.includes("/");
  }

  get dashboardPath() {
    return `${this.outputFolder}/Mood History.md`;
  }

  get entriesFolder() {
    return `${this.outputFolder}/Entries`;
  }

  dateFromPath(path) {
    const filename = String(path || "").split("/").pop() || "";
    const match = filename.match(/^(\d{4}-\d{2}-\d{2})(?:\b|\s|\.|-)/);
    return match && this.isValidDate(match[1]) ? match[1] : null;
  }

  isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) return false;
    const date = new Date(`${value}T12:00:00`);
    return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }

  getDateForFile(file) {
    if (!(file instanceof TFile) || file.extension.toLowerCase() !== "md") return null;
    if (file.path.startsWith(`${this.outputFolder}/`) || file.path.startsWith(".trash/")) return null;
    const pathDate = this.dateFromPath(file.path);
    const insideDailyFolder = this.isInDailyFolder(file.path);
    const includeOutside = this.settings.includeOutsideDailyFolder;
    if (pathDate && (insideDailyFolder || includeOutside)) return pathDate;
    const cache = this.app.metadataCache.getFileCache(file);
    const frontmatter = cache?.frontmatter || {};
    const frontmatterDate = typeof frontmatter.date === "string" ? frontmatter.date.slice(0, 10) : "";
    if (this.isValidDate(frontmatterDate) && (insideDailyFolder || (includeOutside && frontmatter.type === "daily"))) {
      return frontmatterDate;
    }
    if (!includeOutside) return null;
    const aliases = Array.isArray(frontmatter.aliases) ? frontmatter.aliases : [frontmatter.aliases].filter(Boolean);
    const aliasDate = aliases.find((value) => this.isValidDate(String(value)));
    return aliasDate ? String(aliasDate) : null;
  }

  topicForFile(file) {
    const cache = this.app.metadataCache.getFileCache(file);
    const topic = cache?.frontmatter?.topic;
    return typeof topic === "string" ? topic.trim() : "";
  }

  getAllDates() {
    return Array.from(new Set(
      this.app.vault.getMarkdownFiles().map((file) => this.getDateForFile(file)).filter(Boolean)
    )).sort();
  }

  filesForDate(date) {
    return this.app.vault.getMarkdownFiles()
      .filter((file) => this.getDateForFile(file) === date)
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
    const date = this.getDateForFile(file);
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
      `Date: ${date}`,
      "Analyze the emotional state expressed by the journal author in the text below.",
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
    if (!options.force && previous?.contentHash === gathered.contentHash) return false;

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
        confidenceReason: "The dated source was empty or contained only non-text material."
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
    new Notice(`Automatic Mood History: checking ${dates.length} dated entries…`);
    let changed = 0;
    for (const date of dates) {
      if (await this.analyzeDate(date, options)) changed += 1;
    }
    await this.ensureSupportFiles();
    const suffix = this.lastGroqError ? " Groq was unavailable; affected entries use the labeled local fallback." : "";
    new Notice(`Automatic Mood History: ${changed} entries updated.${suffix}`, 9000);
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
    const dashboard = `---\ntype: "mood-history-dashboard"\naliases:\n  - "Mood Tracker"\n---\n\n# Mood History\n\nThis dashboard automatically analyzes dated notes. Scores are text inferences, not diagnoses. Open a source note before treating a score as definitive.\n\n\`\`\`automatic-mood-history\n\`\`\`\n\n## All entries\n\n![[${this.outputFolder}/Mood History.base]]\n\n## How it works\n\n- [[${this.outputFolder}/Methodology|Methodology and scoring]]\n- Use the command **Automatic Mood History: Reanalyze all daily notes with Groq** to retry Groq or refresh every date.\n`;
    const base = `filters:\n  and:\n    - file.inFolder("${this.entriesFolder}")\n    - type == "automatic-mood-entry"\nproperties:\n  mood:\n    displayName: Mood\n  energy:\n    displayName: Energy\n  connection:\n    displayName: Connection\n  intensity:\n    displayName: Intensity\n  analysis_source:\n    displayName: Analyzer\nviews:\n  - type: table\n    name: Mood history\n    order:\n      - date\n      - mood\n      - energy\n      - connection\n      - intensity\n      - emotions\n      - confidence\n      - analysis_source\n      - source_notes\n`;
    const methodology = `---\ntype: "guide"\n---\n\n# Mood History methodology\n\n[[${this.outputFolder}/Mood History|Back to Mood History]]\n\n## Scores\n\n- **Mood:** 1 strongly negative or severe distress; 3 mixed or neutral; 5 strongly positive.\n- **Energy:** 1 depleted or inert; 5 highly activated.\n- **Connection:** 1 isolated or unseen; 5 deeply connected or supported.\n- **Intensity:** 1 emotionally muted; 5 extremely forceful or emotionally charged.\n\n## Evidence rules\n\nThe analyzer consolidates all dated Markdown sources for one calendar day, removes duplicate paragraphs, and hashes the result. It runs again only when that source changes. Empty and image-only dates are recorded as insufficient evidence.\n\nThe prompt distinguishes the author's feelings from quoted text, abstract analysis, negation, and feelings attributed to other people. The result is still an inference. It is not a medical assessment or an objective fact.\n\n## Groq and fallback\n\nGroq is used when \`${this.settings.apiKeyEnvironmentVariable}\` is available and the API is reachable. The API key is read from the process environment and is never saved in this vault. If Groq cannot be reached, a deterministic local word-pattern fallback produces a low-confidence directional result. Every entry records its analyzer.\n`;
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
    const complete = records.filter((record) => record.status === "complete" && Number.isFinite(record.moodScore));

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
    provenance.setText(`Analyzer coverage: ${groqCount} Groq · ${reviewedCount} reviewed backfill · ${fallbackCount} local fallback · ${records.length - complete.length} insufficient evidence.`);
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
    for (const label of ["Date", "Mood", "Energy", "Connection", "Emotions", "Reading", "Analyzer"]) {
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
      text: "Local analysis is the default. Groq is optional and off until enabled. Its key is read from GROQ_API_KEY in the Obsidian process environment and is never stored in this vault."
    });
    new Setting(containerEl)
      .setName("Enable Groq analysis")
      .setDesc("When enabled, analysis may send cleaned dated-note text to Groq. This setting is off by default.")
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
      .setName("Daily notes folder")
      .setDesc("Only notes in this folder are included by default. Use a vault-relative folder path.")
      .addText((text) => text
        .setValue(this.plugin.settings.dailyFolder)
        .onChange(async (value) => {
          this.plugin.settings.dailyFolder = value.trim().replace(/^\/+|\/+$/g, "") || "Daily";
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Analyze dated notes outside this folder")
      .setDesc("Also include date-named notes elsewhere and exact date aliases on moved notes.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.includeOutsideDailyFolder)
        .onChange(async (value) => {
          this.plugin.settings.includeOutsideDailyFolder = value;
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Analyze note changes automatically")
      .setDesc("Reanalyze a date after a dated source note changes.")
      .addToggle((toggle) => toggle
        .setValue(this.plugin.settings.autoAnalyze)
        .onChange(async (value) => {
          this.plugin.settings.autoAnalyze = value;
          await this.plugin.savePluginData();
        }));
    new Setting(containerEl)
      .setName("Backfill on startup")
      .setDesc("Check all dated notes after Obsidian starts. Unchanged source hashes are skipped.")
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
      .setName("Retry every date with Groq")
      .setDesc("Forces reanalysis and retries Groq even after a recent network error.")
      .addButton((button) => button.setButtonText("Retry Groq").onClick(() => {
        void this.plugin.retryAllWithGroq();
      }));
  }
}

module.exports = AutomaticMoodHistoryPlugin;
