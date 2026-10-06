# Automatic Mood History

Automatic sentiment history for notes in [Obsidian](https://obsidian.md/).

The plugin groups every Markdown note by the local calendar date of its Obsidian creation timestamp, consolidates notes created that day across all folders, and renders a native dashboard with mood, energy, connection, intensity, emotions, confidence, and source links. Local analysis is the default. Groq analysis is optional and must be enabled explicitly.

## Features

- Optional automatic analysis after any note changes
- One consolidated result per calendar date
- Optional Groq structured-output analysis with a validated three-stage JSON fallback
- Local deterministic analysis that works without a network connection or API key
- Native Markdown entry notes and an Obsidian Base
- Mood, energy, connection, and intensity scores from 1–5
- Dominant-emotion history and day-by-day source links
- Light and dark themes with a colorful neo-brutalist dashboard that adapts to Obsidian theme colors
- Source hashes so unchanged notes are skipped
- Empty and image-only days marked as insufficient evidence instead of receiving invented scores

## Privacy

This plugin can transmit cleaned text from all Markdown notes created on a selected day to Groq for analysis **only after you enable Groq analysis in the plugin settings**.

- The API key is read only from the `GROQ_API_KEY` environment variable.
- The API key is never written to the vault or plugin data.
- Groq receives the local creation date, cleaned text consolidated across that day's notes, scoring instructions, and response schema.
- Filenames and vault paths remain local and are not included in the Groq prompt.
- Generated records include the analyzer used: `groq`, `local` (intentional local analysis), `local-fallback`, `reviewed-backfill` (legacy records), or `none`.
- When Groq is enabled, eligible analysis uses Groq only. If Groq is unavailable, paused, or returns unusable output, existing records are preserved and new or changed work stays pending; it is not silently scored locally.

Automatic note watching and startup backfill are also disabled by default. Do not enable Groq analysis if you do not want your dated-note text sent to Groq.

Groq's handling of API data is governed by [Groq's current data-handling policy](https://console.groq.com/docs/your-data). Do not assume the plugin can change Groq's retention or abuse-monitoring policies.

Generated mood summaries, scores, emotions, source paths, and timestamps are stored in the plugin's `data.json` and generated Markdown entries. Those derived records are sensitive and may be copied by Obsidian Sync, OneDrive, Git, or any other system that syncs your vault.

## Requirements

- Obsidian 1.5.0 or newer
- Desktop Obsidian
- An optional Groq API key for remote analysis

The default model is `openai/gpt-oss-20b`, configurable in settings.

## Installation

### From a GitHub release

1. Download `main.js`, `manifest.json`, and `styles.css` from the release matching the version in `manifest.json`.
2. Create this folder inside your vault:

   ```text
   .obsidian/plugins/automatic-mood-history/
   ```

3. Copy the three files into that folder.
4. Restart Obsidian.
5. Enable **Automatic Mood History** under **Settings → Community plugins**.

### Set the Groq key

To use Groq, set `GROQ_API_KEY` in the environment before starting Obsidian, then enable **Enable Groq analysis** in the plugin settings. On Windows, a user-level environment variable may require restarting Obsidian or signing out and back in before GUI applications inherit it.

The key value is not stored by the plugin. The environment-variable name is fixed so vault data cannot select an arbitrary environment secret.

## Usage

Use the command palette:

- **Automatic Mood History: Open mood history dashboard**
- **Automatic Mood History: Analyze changed notes**
- **Automatic Mood History: Reanalyze all notes with Groq**
- **Automatic Mood History: Retry fallback entries with Groq**
- **Automatic Mood History: Analyze the active note**
- **Automatic Mood History: Check Groq connection with sample text**

**Check Groq** sends a fictional sample instead of vault notes and shows whether the configured model returns valid analysis. The dashboard shows connection status, the last valid response, or a specific failure category. **Analyze changed** retries eligible local or fallback results with Groq and includes legacy-date records. **Retry all with Groq** bypasses an old pause once; a new rate limit pauses the remaining requests in that run and leaves them pending. Rate-limit pauses follow Groq's `Retry-After` header when supplied.

Every Markdown note is assigned to the local calendar day of `TFile.stat.ctime`, Obsidian's file creation timestamp. Folder, filename, frontmatter dates, and aliases do not change the assigned day. Notes without a valid creation timestamp are skipped. Generated `Mood History/` files and notes under `.trash/` are excluded. Older entries based on filename or frontmatter dates are preserved and labeled **Legacy date** in the dashboard.

### Pane-responsive dashboard

**Retry fallback entries** retries only saved `local-fallback` results. **Analyze changed** also includes every legacy-date record, regardless of its previous analyzer, when Groq is enabled. Legacy recovery reads its saved source notes rather than substituting unrelated notes created on that calendar date, and keeps the legacy date label. Missing/empty sources and failed/provider-paused retries keep the existing result unchanged. A connected provider status does not mean cached history has already been reanalysed; the dashboard reports pending fallbacks. No automatic/startup analysis preference is enabled by this recovery change.

The dashboard is designed for vertical scrolling only. Charts redraw for the note pane's width with readable axes and fewer date labels when space is tight; no data points are dropped. Day-by-day cards wrap scores, emotion labels, analyzer/date-basis badges, and the complete summary rather than forcing a wide table or truncating text. Controls and settings also reflow based on their own pane, not the overall application window.

Existing plugin-owned dashboard notes have only their exact Base embed replaced by a link; custom writing and metadata are preserved. The optional native Base table remains available as a separate Obsidian view with its own table behavior, but it is no longer embedded in the dashboard.

Local analysis is the default. Automatic note watching and startup analysis are off for new installs. Enabling Groq can send the cleaned text from every eligible note in an analyzed creation-date group or saved legacy-date group to Groq; review the opt-in settings before running a full scan. Text below the minimum evidence threshold remains marked insufficient without scores.

Generated files are stored under `Mood History/` by default:

```text
Mood History/
├── Mood History.md
├── Mood History.base
├── Methodology.md
└── Entries/
    └── YYYY-MM-DD.md
```

## Scoring

| Measure | 1 | 3 | 5 |
|---|---|---|---|
| Mood | Strongly negative or severe distress | Mixed or neutral | Strongly positive |
| Energy | Depleted or inert | Moderate | Highly activated |
| Connection | Isolated or unseen | Mixed | Deeply connected or supported |
| Intensity | Emotionally muted | Moderate | Extremely forceful or charged |

The analyzer is instructed to distinguish the author's feelings from quotations, abstract analysis, negation, and feelings attributed to other people. Results remain inferences, not diagnoses or objective facts.

This is a reflective journaling tool. It is not a clinical, diagnostic, crisis-detection, or safety-monitoring system.

## Data lifecycle

- Disable **Analyze note changes automatically** to stop automatic refreshes.
- Disable **Enable Groq analysis** to keep subsequent analysis local.
- Delete `Mood History/` to remove generated Markdown and Base files.
- Disable the plugin before deleting its `data.json` if you want to reset cached history.
- Generated entry files carry an ownership marker. If an expected entry path contains an unrelated note, the plugin creates a conflict-safe file instead of overwriting it.

## Development

```bash
npm test
npm run build
```

`npm run build` combines `src/sentiment-core.js` and `src/main.js` into the single `main.js` file Obsidian loads.

## Release files

An Obsidian release must attach:

- `main.js`
- `manifest.json`
- `styles.css`

The release tag must exactly match the version in `manifest.json`.

## License

[MIT](LICENSE)
