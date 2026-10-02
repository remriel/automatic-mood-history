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

Notes are grouped by Obsidian's `TFile.stat.ctime` creation timestamp. The plugin excludes its generated `Mood History/` files and `.trash/` notes. It does not include vault paths or filenames in the prompt. It reads the API key from `GROQ_API_KEY` in the Obsidian process environment and does not persist the key.

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
