# Privacy

Automatic Mood History operates in two modes.

## Local mode

Local mode uses deterministic contextual English rules inside Obsidian. No note text is intentionally transmitted by this plugin. Local results are directional and marked low confidence. Comparisons across dates use already saved analysis evidence locally; the plugin does not reread earlier days or add their text to a Groq request for these comparisons.

## Optional Groq mode

Groq mode is disabled by default. When a user explicitly enables it, the plugin sends the following to `https://api.groq.com/openai/v1/chat/completions`:

- local creation date;
- cleaned eligible passages from Markdown notes created on that day, with opaque passage IDs and separately labeled neighboring context; repeated requests and context count toward the retained per-run character budget;
- scoring instructions;
- a JSON response schema.

Notes are grouped by Obsidian's `TFile.stat.ctime` creation timestamp. The plugin excludes its generated `Mood History/` files and `.trash/` notes. It does not include vault paths or filenames in the prompt. It reads the API key from `GROQ_API_KEY` in the Obsidian process environment and does not persist the key.

Groq controls its own processing and retention. Review [Groq's data-handling documentation](https://console.groq.com/docs/your-data) before enabling remote analysis.

## Locally stored data

The plugin stores settings and derived results in its Obsidian plugin `data.json`. It also generates Markdown entries and a Base under `Mood History/` by default. Stored data can include:

- dates and source paths;
- mood, energy, connection, and intensity scores;
- emotions, summaries, drivers, and confidence explanations;
- short exact excerpts from the selected source text (up to 16 signal quotations of 240 characters and eight observations with up to three 240-character quotations each), with dimension, direction and evidence confidence;
- bounded local comparison snapshots, including earlier observed dates, repeated emotional expressions and matching situation wording;
- complete-input hashes, timestamps, model identifiers, bounded error reason codes, source coverage counts and compact local source/offset mappings;
- durable pending chunks with up to 16 evidence excerpts and eight observations per chunk, explicit passage/dimension outcomes and request/token counters. Pending chunk results are deleted after the replacement commits; full raw source notes and raw provider responses are not cached.

These records may be sensitive and now intentionally include short source quotations, though not the full original notes. Repeated comparison evidence can also quote earlier derived excerpts. Vault sync, cloud drives, backup programs, or Git repositories may copy them. Excluding a source later stops future reads and remote submission, but does not delete previously saved history or quotations; remove those generated entries and records separately if needed.

## Telemetry

The plugin contains no analytics or telemetry service. Network access is used only for optional Groq requests initiated by enabled analysis behavior.

## Upgrade and repair

Older remote results are exposed as stale or assessment coverage unknown without resending historical notes automatically. A local repair preview identifies proposed work and allows explicit batch selection. Display-only repair makes no provider requests. Original successful records remain visible until complete replacement commits. No prior-day history is added to remote context.
