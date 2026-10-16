# Automatic Mood History

## Accountable coverage in 1.4

The complete eligible input is hashed before request limits. Long dates are split deterministically with local source mappings and opaque provider passage IDs. Every eligible passage must have an explicit assessed outcome and all four dimensions must be resolved before a replacement commits. Completion, dimension assessment and available scores are separate: supported, assessed without support, ambiguous, unresolved conflict and not yet assessed remain distinguishable. Legacy assessment coverage is unknown.

The saved character limit is now a **per-run source-data budget**, including repeated attempts and neighboring context. It is retained during upgrade. Successful chunks survive reload and resume under identical source/pipeline/provider/model/prompt fingerprints. Dates exceeding the budget remain visibly queued; the prior successful entry stays available. The minimum-character policy is explicit and records its excluded, unassessed coverage.

Use **Preview repair** on the dashboard to inspect stale fingerprints, unknown/incomplete coverage, missing assessments, conflicts and failed work. Select a batch to see chunk/request estimates and repair it. Display-only corrections use no provider calls. Upgrading does not silently reprocess saved remote history; matching legacy prefix hashes are flagged stale because their historical full coverage cannot be established.

Mood, connection, energy and intensity have independent populations and chart gaps. Valid connection-only or energy-only days remain visible. Provider interpretation uses exact passage quotations, explicit/inferred meaning, personal/textual basis, temporal context and support. One targeted review addresses omitted/conflicting dimensions; explicit abstention is valid. All validated concepts and opposing poles contribute to aggregation, independently of the 16 displayed quotations or artificial chunk boundaries. Local rules remain conservative and English-focused.

See [coverage architecture and acceptance](docs/COVERAGE_DESIGN.md), [baseline reproductions](docs/COVERAGE_BASELINE.md), and the evaluation/performance JSON files linked there. These are engineering checks, not psychological or clinical validation. The earlier 1.3 descriptions below are historical where superseded by 1.4.

Analysis caching uses a versioned fingerprint covering the source hash, text pipeline, analyzer/prompt/model, evidence thresholds and local topic semantics. Local results with fingerprints refresh when those semantics change. Unchanged Groq results are preserved after model or prompt changes until you explicitly choose **Retry all with Groq** or analyze the active note; a model change alone does not spend provider quota. Changed source text is analyzed during the next authorized scan. Records without fingerprints keep their historical provenance and result until source changes or explicit reanalysis; no missing provenance is invented.

Full scans build a temporary date-to-files index once. Source eligibility, file identity and metadata are checked again before reads and requests; changed scope cancels the scan. The index retains file references and paths only, and is discarded after each scan. It does not cache note text or reduce provider latency.

Generated provider summaries, drivers and confidence explanations are bounded plain text. Markdown punctuation is serialized as literal characters and line breaks are collapsed, so narrative fields cannot create links, images, embeds or HTML. Intended source-note links remain available separately. Summaries and confidence explanations are limited to 500 characters; each of up to four drivers is limited to 250 characters. Native Obsidian 1.14.4 synthetic checks verify literal readable output with no narrative link/image/embed/script elements.

Empty, standard Markdown image-only, wikilink image-only, HTML image-only and frontmatter-only notes provide no written evidence. Markdown blockquotes and prose Mermaid mindmaps are retained; executable code is excluded. Local analysis now uses contextual English rules for attribution, negation, hypothetical/abstract discussion, mixed feelings and explicit emotional evidence. Its confidence remains low because rule coverage is limited.

## Emotional analysis in 1.3

The local engine replaces global word counting with clause-level evidence. It distinguishes a personally felt state from other people's feelings, quotations, first-person intellectual discussion and wishes. Four dimensions are scored independently: fatigue does not imply sadness, solitude does not establish loneliness, and the presence of friends does not prove felt connection. Unsupported dimensions are `null` and appear as **— / Not evidenced**, rather than invented neutral scores. A long note without usable personal emotional signals can be marked **insufficient**.

The engine retains competing feelings and explicitly marked changes within the writing. It records possible sarcasm without reversing sentiment automatically; explicit needs, event/feeling associations and self-reported recurrence have concrete quotation anchors. Activation and depletion can coexist. Intensity comes from the expressed state and modifiers, rather than profanity, punctuation or repeated words. Evidence and context are available in each entry and an expandable dashboard panel, including unscored entries.

New Groq responses must supply source evidence. Quotations are checked against the submitted cleaned text, clear literal misattribution is checked locally without requiring a local lexical match, and unsupported dimensions lose their scores. A score that contradicts its cited direction is left unscored with an explanation; the other grounded passages are retained. Explanations are built from validated signal labels, source quotations and bounded interpretation templates; unrestricted model summaries are not persisted as the explanation. Quotation matching cannot prove the interpretation is correct. Provider evidence confidence is capped at medium, ambiguities remain tentative, and local results remain low confidence.

In 1.3.2, Groq also retains emotionally charged commentary, second-person address and clipped passages as **textual charge**. These passages can support intensity without proving the author's personal mood, energy or connection. Each such signal is labeled in the entry and dashboard. Neutral definitions and mere mentions of emotion can still be unscored. A first empty assessment always receives one semantic review; if local personal signals remain omitted, the existing record is preserved and the date remains pending. JSON fallback can repair misplaced observation/limitation containers without changing their contents, and format retries receive validation guidance. GPT-OSS models use medium reasoning effort with the existing completion limits. Previously saved remote results still require explicit reanalysis; upgrading alone does not send them again.

Comparisons across dates use only already saved evidence, locally, with matching source scope, analyzer generation, model, provider and date basis. Up to 14 earlier observed dates within 30 days can supply a numerical comparison. Repeated feelings and exact event/feeling wording require at least three observed dates. Gaps are not filled in and a recurring phrase is not a diagnosis, personality trait or proof of causation. Comparisons are snapshots taken when an entry is analyzed; reanalyze after changing earlier entries to refresh them. No earlier writing is added to a Groq request.

Existing record identities, score field names, source links and historical provenance are preserved. Fingerprinted local results refresh on the next authorized scan. Unchanged remote results still require explicit reanalysis after a prompt/model change. Existing Methodology notes are preserved; consult this section and [the engine design and evaluation](docs/EMOTIONAL_ENGINE.md) for the new behavior. Local rules are English-focused and can miss subtle metaphor, indirect feeling, unfamiliar wording and cultural context. The included benchmark is an engineering evaluation, not clinical validation.

![Automatic Mood History for Obsidian: mood and energy trends presented in a colorful dashboard-style graphic with illustrative data.](assets/readme-banner.svg)

**[Download the latest Obsidian plugin files](https://github.com/remriel/automatic-mood-history/releases/latest)** · [Installation](#installation) · [Privacy](#privacy)

Automatic sentiment history for notes in [Obsidian](https://obsidian.md/).

The plugin groups eligible Markdown notes by the local calendar date of their Obsidian creation timestamp, consolidates permitted notes across folders, and renders a native dashboard with mood, energy, connection, intensity, emotions, confidence, and source links. Local analysis is the default. Groq analysis is optional and must be enabled explicitly.

## Features

- Optional automatic analysis after changes to included notes
- Folder include/exclude lists, with subfolder support and exclusions taking precedence
- One consolidated result per calendar date
- Optional Groq structured-output analysis with a validated three-stage JSON fallback
- Local deterministic analysis that works without a network connection or API key
- Evidence-backed independent scores, mixed emotions, contextual observations and local sparse-history comparisons
- Native Markdown entry notes and an Obsidian Base
- Mood, energy, connection, and intensity scores from 1–5, all plotted in the trend chart
- Dominant-emotion history and day-by-day source links
- Light and dark themes with a colorful neo-brutalist dashboard that adapts to Obsidian theme colors
- Source hashes so unchanged notes are skipped
- Empty and image-only days marked as insufficient evidence instead of receiving invented scores

## Privacy

This plugin can transmit cleaned text from eligible Markdown notes created on a selected day to Groq for analysis **only after you enable Groq analysis in the plugin settings**. Folder filters restrict which notes can be read and sent.

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

Every eligible Markdown note is assigned to the local calendar day of `TFile.stat.ctime`, Obsidian's file creation timestamp. Folder, filename, frontmatter dates, and aliases do not change the assigned day. Notes without a valid creation timestamp are skipped. Generated `Mood History/` files and notes under `.trash/` are excluded. Older entries based on filename or frontmatter dates are preserved and labeled **Legacy date** in the dashboard.

### Folder scope

In **Settings → Automatic Mood History**, specify **Include folders** and **Exclude folders**, one vault-relative path per line:

- Empty include list means all folders and root-level notes.
- Each included folder matches its own notes and all subfolders.
- Exclusions take priority. For example, include `Journal` and exclude `Journal/Private`.
- Use `/` for notes located directly at the vault root. Folder names are case-sensitive.
- The generated Mood History directory and Obsidian trash are excluded automatically. Filter rules also apply to legacy Groq recovery.

Changes affect future analysis and what may be transmitted to Groq. Older generated history is preserved. Run **Analyze changed** to recompute days that still have eligible notes; remove older records manually when all their sources are excluded.

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
- Set **Include folders** and **Exclude folders** to restrict future analysis and remote requests. Old records remain until you remove them.
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

### Recovering pending entries

The dashboard shows whether automatic analysis is enabled. With **Analyze note changes automatically** on, the plugin catches up at startup, retries failed date groups with increasing delays (up to one hour), and periodically checks for missed changes while Obsidian is open. Existing results remain visible until a replacement is saved. Use **Analyze changed** for an immediate date retry; account-wide Groq pauses still apply.

If a cloud-only source note is unreadable, make it available locally and check the cloud sync client. That date stays pending without sending a partial source set; other readable dates continue. Valid natural emotion labels are accepted even when they are outside the local lexicon.

### Chart series visibility

Click a series label in the chart legend to show or hide its line and points. All four series start visible. The selected visibility is saved across refreshes and restarts; this changes only the chart, never scores or analysis. Keyboard users can Tab to each button and use Space or Enter.

## More Obsidian projects

- [Untitled Auto Title](https://github.com/remriel/obsidian-untitled-auto-title): generate meaningful filenames from untitled Markdown notes.
- [Acid Xerox](https://github.com/remriel/acid-xerox-theme): a colorful, 90s-inspired Obsidian theme.
