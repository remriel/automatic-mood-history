# Privacy

Automatic Mood History operates in two modes.

## Local mode

Local mode uses deterministic word-pattern scoring inside Obsidian. No note text is intentionally transmitted by this plugin. Local results are directional and marked low confidence.

## Optional Groq mode

Groq mode is disabled by default. When a user explicitly enables it, the plugin sends the following to `https://api.groq.com/openai/v1/chat/completions`:

- local creation date;
- cleaned, consolidated text from all Markdown notes created on that day, across folders, up to the configured character limit;
- scoring instructions;
- a JSON response schema.

Notes are grouped by Obsidian's `TFile.stat.ctime` creation timestamp. The plugin excludes its generated `Mood History/` files and `.trash/` notes. It does not include vault paths or filenames in the prompt.

On desktop, `GROQ_API_KEY` in the Obsidian process environment takes precedence. On Android, iPhone and desktop with Obsidian 1.11.4+, you can save a key using Obsidian's native secret storage. The fixed secret ID is `automatic-mood-history-groq`. Keys entered in the masked settings field are passed only to Obsidian secret storage and are never written to plugin `data.json`, generated notes or logs. The plugin does not implement its own encryption or control Obsidian's secret-storage and sync behavior. Configure the key on each device where needed. Clearing the saved key does not remove a desktop environment variable.

Saving a key does not enable Groq or initiate analysis. Automatic analysis remains opt-in. Android and iOS may suspend the app in the background; automatic catch-up runs when Obsidian returns to the foreground, subject to existing consent, source filters and retry pauses.

Groq controls its own processing and retention. Review [Groq's data-handling documentation](https://console.groq.com/docs/your-data) before enabling remote analysis.

## Locally stored data

The plugin stores settings and derived results in its Obsidian plugin `data.json`. It also generates Markdown entries and a Base under `Mood History/` by default. Stored data can include:

- dates and source paths;
- mood, energy, connection, and intensity scores;
- emotions, summaries, drivers, and confidence explanations;
- content hashes, timestamps, model identifiers, and provider errors.

These records may be sensitive even though they do not contain the full original note text. Vault sync, cloud drives, backup programs, or Git repositories may copy them.

## Telemetry

The plugin contains no analytics or telemetry service. Network access is used only for optional Groq requests initiated by enabled analysis behavior.
