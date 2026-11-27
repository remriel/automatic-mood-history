# Privacy

Automatic Mood History operates in two modes.

## Local mode

Local mode uses deterministic word-pattern scoring inside Obsidian. No note text is intentionally transmitted by this plugin. Local results are directional and marked low confidence.

## Optional cloud analysis

Cloud analysis starts disabled. Selecting a different provider turns it off again. Once you enable the selected provider, analysis sends the detected date, cleaned text from eligible notes for that day up to the character limit, scoring instructions, and the expected JSON format. The fictional connection check uses sample text.

The plugin contacts only the selected endpoint:

- Groq — `https://api.groq.com/openai/v1/chat/completions`
- OpenAI — `https://api.openai.com/v1/chat/completions`
- Anthropic Claude — `https://api.anthropic.com/v1/messages`
- Google Gemini — `https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`
- DeepSeek — `https://api.deepseek.com/chat/completions`

Folder rules determine which notes are eligible. The plugin excludes generated history and trash, and sends no filename or vault-path metadata. Your selected provider controls its processing and retention.

On desktop the selected provider's fixed environment variable takes precedence. On Obsidian 1.11.4+ the masked key field uses Obsidian secret storage with a separate fixed ID for each provider. Saving a key sends no request. Clearing it only affects that provider's saved key. Keys are excluded from plugin settings, generated notes and logs. Automatic analysis requires a separate opt-in.

## Locally stored data

The plugin stores settings and derived results in its Obsidian plugin `data.json`. It also generates Markdown entries and a Base under `Mood History/` by default. Stored data can include:

- dates and source paths;
- mood, energy, connection, and intensity scores;
- emotions, summaries, drivers, and confidence explanations;
- content hashes, timestamps, model identifiers, and provider errors.

These records may be sensitive even though they do not contain the full original note text. Vault sync, cloud drives, backup programs, or Git repositories may copy them.

## Telemetry

The plugin contains no analytics or telemetry service. Network access is used only for optional requests to the selected provider initiated by enabled analysis behavior.
