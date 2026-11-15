# Automatic Mood History

![Automatic Mood History: an illustrated desktop and phone dashboard with colorful mood trends. Desktop, Android and iPhone. Local first, with optional Groq AI.](assets/readme-banner.png)

**Your notes. Your emotional timeline.**

Turn your [Obsidian](https://obsidian.md/) journal into a mood history you can explore on **desktop, Android and iPhone**. See mood, energy, connection and intensity trends, emotion patterns, and the original notes behind each day.

Start with offline Morning Pages analysis that runs inside Obsidian. Optionally connect Groq for contextual AI analysis. You choose which folders to include and whether analysis runs automatically.

**[Download the latest release](https://github.com/remriel/automatic-mood-history/releases/latest)** · [Mobile setup](#android-and-iphone) · [Installation](#installation) · [Privacy](#privacy)

*Banner artwork is illustrative; it does not show personal mood data or an exact app screenshot.*

## Features

- Desktop, Android and iPhone support, with responsive layouts and touch-friendly controls
- Optional automatic analysis after changes to included notes
- Folder include/exclude lists, with subfolder support and exclusions taking precedence
- One consolidated result per calendar date
- Optional Groq structured-output analysis with GoEmotions-informed vocabulary and a validated three-stage JSON fallback
- Morning Pages word-list fallback scoring that works without a network connection or API key
- Choose daily Markdown entries, compact monthly exports, or dashboard-only history
- Monthly exports include readable daily details and lossless JSON recovery records; the optional Obsidian Base uses daily entries
- Mood, energy, connection, and intensity scores from 1–5, all plotted in the trend chart
- Dominant-emotion history and day-by-day source links
- Light and dark themes with a colorful neo-brutalist dashboard that adapts to Obsidian theme colors
- Source hashes so unchanged notes are skipped
- Empty and image-only days marked as insufficient evidence instead of receiving invented scores

## Privacy

This plugin can transmit cleaned text from eligible Markdown notes created on a selected day to Groq for analysis **only after you enable Groq analysis in the plugin settings**. Folder filters restrict which notes can be read and sent.

- Save a Groq key through Obsidian secret storage (Obsidian 1.11.4+), or use `GROQ_API_KEY` on desktop.
- Keys are never written to plugin data, generated notes or intentional logs. Obsidian manages secret storage separately.
- Groq receives the detected entry date, cleaned text consolidated across that day's notes, scoring instructions, and response schema.
- Filenames and vault paths remain local and are not included in the Groq prompt.
- Generated records include the analyzer used: `groq`, `morning-pages-fallback`, `local` or `local-fallback` (older scores), `reviewed-backfill`, or `none`.
- When Groq is disabled, unavailable, paused, or returns unusable output, new or changed writing receives a clearly labeled Morning Pages fallback score. Failed Groq attempts remain pending for retry. An unchanged saved result is preserved when an explicit retry fails.

Automatic note watching and startup backfill are also disabled by default. Do not enable Groq analysis if you do not want your dated-note text sent to Groq.

Groq's handling of API data is governed by [Groq's current data-handling policy](https://console.groq.com/docs/your-data). Do not assume the plugin can change Groq's retention or abuse-monitoring policies.

Generated mood summaries, scores, emotions, source paths, and timestamps are stored in the plugin's `data.json` and generated Markdown entries. Those derived records are sensitive and may be copied by Obsidian Sync, OneDrive, Git, or any other system that syncs your vault.

## Requirements

- Obsidian 1.5.0 or newer
- Desktop, Android or iPhone/iPad
- Obsidian 1.11.4+ to save an optional Groq API key through secret storage; older desktop versions can use an environment key
- No API key or connection is needed for local analysis

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

### Android and iPhone

The same release files run on desktop and mobile. You can install directly on your phone using the community plugin [BRAT](https://github.com/TfTHacker/obsidian42-brat):

1. In **Settings → Community plugins → Browse**, install and enable **BRAT**.
2. In BRAT settings, choose **Add beta plugin** and enter `https://github.com/remriel/automatic-mood-history`.
3. Enable **Automatic Mood History** in Community plugins, then use the command palette to open **Mood history dashboard**.

You can also install the release files on desktop and sync community plugins to your phone using your vault's supported plugin-sync settings. Check that the phone has all three matching release files, then restart Obsidian. On Android, manual installation into the vault's `.obsidian/plugins/automatic-mood-history/` folder is another option; enable hidden files in your file manager.

Local analysis is ready without a key. For Groq, configure a key on each device where needed using the steps below.

Android and iOS may suspend Obsidian in the background. Automatic catch-up runs while the app is open and after returning to the foreground, respecting your automatic-analysis setting and retry pauses. **Analyze on startup** alone does not enable repeated resume scans. File creation dates come from the local vault's timestamps; sync tools can handle those timestamps differently across devices.

### Set the Groq key

On **Android, iPhone or desktop with Obsidian 1.11.4+**:

1. Open **Settings → Automatic Mood History**.
2. Paste your key into **Groq API key** and tap **Save key**. The field clears after saving; Obsidian secret storage keeps the value under `automatic-mood-history-groq`.
3. Enable **Enable Groq analysis**, then use **Check Groq** on the dashboard to test with fictional sample text.

Saving a key does not enable remote analysis or send notes. **Clear saved key** clears the Obsidian secret; it does not remove a desktop environment key. Obsidian controls its secret-storage and sync behavior. The plugin never stores a key in its own `data.json` or generated notes.

On **desktop**, you can keep using `GROQ_API_KEY` in the environment before starting Obsidian. This takes precedence over a saved secret. On Windows, restart Obsidian after setting a user-level environment variable. Environment-variable and secret names are fixed so synced plugin data cannot select unrelated secrets.

## Usage

Use the command palette:

- **Automatic Mood History: Open mood history dashboard**
- **Automatic Mood History: Analyze changed notes**
- **Automatic Mood History: Reanalyze all notes with Groq**
- **Automatic Mood History: Retry fallback entries with Groq**
- **Automatic Mood History: Analyze the active note**
- **Automatic Mood History: Check Groq connection with sample text**

**Check Groq** sends a fictional sample instead of vault notes and shows whether the configured model returns valid analysis. The dashboard shows connection status, the last valid response, or a specific failure category. **Analyze changed** retries eligible local or fallback results with Groq and includes legacy-date records. **Retry all with Groq** bypasses an old pause once; a new rate limit pauses the remaining requests in that run and leaves them pending. Rate-limit pauses follow Groq's `Retry-After` header when supplied.

Eligible Markdown notes in any included folder use a date detected in the filename: the configured Daily Notes format, common numeric and written-month formats, and date tokens inside titles. Duplicate suffixes such as `2024-03-04 (2).md` and titles such as `Notes — March 4, 2024.md` retain their original date instead of falling back to the import timestamp. Numeric formats accept padded or unpadded month/day values and hyphens, periods, or underscores. **Ambiguous numeric dates** selects month–day–year, day–month–year, or skip (the compatibility default). Unambiguous dates work in either convention; filenames containing two distinct valid dates remain skipped. This does not promise every language or arbitrary date notation. Undated notes use the local calendar day of `TFile.stat.ctime`; those without a valid timestamp are skipped. Frontmatter dates, aliases, and dates in the note body are not used. Existing results remain saved until reanalysis; old date groups are not deleted automatically. Generated `Mood History/` files and notes under `.trash/` are excluded. Older entries based on filename or frontmatter dates are preserved and labeled **Legacy date** in the dashboard.

### Compact history

In settings, choose **Markdown history output → Monthly notes (recommended)** to export existing saved history without another analysis request. Future results update one `Mood History/Months/YYYY-MM.md` per month. Each export includes readable daily entries and a JSON recovery block containing the complete saved records, including separate historical date identities. Plugin `data.json` remains the live history and authority. If it loads successfully with no records, startup restores valid monthly recovery blocks into `data.json` before pending-write recovery or automatic analysis. The empty dashboard also offers **Restore from monthly notes**. To restore records after partial loss, run **Automatic Mood History: Restore history from monthly notes** from the command palette. Restore adds only missing date-and-basis records. Existing records win, monthly Markdown stays untouched, and no analysis or Groq request runs.

**Refresh monthly exports** rebuilds exports from saved history. Edited or unrelated monthly files remain protected, so move them aside before refreshing. A refresh also stops if a recovery block contains records absent from `data.json`. Restore those records first. A failed export leaves a prepared result for recovery.

**Dashboard only** stores results in plugin `data.json` without daily or monthly entry writes. Expand **Signals and source notes** on a day to read evidence and open original notes. Back up plugin data separately if using this mode. Monthly recovery can restore valid records when JSON history is empty or partially missing; it does not merge over an existing record with the same date and date basis. Verify that your sync and backup tools include both plugin data and monthly notes; simultaneous writes from multiple devices are not transactionally merged.

Monthly output is the default when no output preference is saved. Existing saved daily or dashboard-only choices are preserved; an unfinished legacy write keeps its original output mode for safe recovery. Use **Export months** to create monthly notes for existing history. Daily output supports the optional Base. Changing output never deletes existing entries or source notes. If a daily note differs from the previous generated record, exports and reanalysis preserve it and write a separate recovered entry. Before archiving daily entries, verify monthly recovery records against plugin data, preserve any edits or orphaned older entries, and retain an exact backup outside the active notes. Do not change output modes while result recovery is pending. Changing the date convention or installing the import-date fix may require **Analyze changed** to score the corrected groups; a mixed old score is never copied to several dates.

### Folder scope

In **Settings → Automatic Mood History**, specify **Include folders** and **Exclude folders**, one vault-relative path per line:

- Empty include list means all folders and root-level notes.
- Each included folder matches its own notes and all subfolders.
- Exclusions take priority. For example, include `Journal` and exclude `Journal/Private`.
- Use `/` for notes located directly at the vault root. Folder names are case-sensitive.
- The generated Mood History directory and Obsidian trash are excluded automatically. Filter rules also apply to legacy Groq recovery.

Changes affect future analysis and what may be transmitted to Groq. Older generated history is preserved. Run **Analyze changed** to recompute days that still have eligible notes; remove older records manually when all their sources are excluded.

### Pane-responsive dashboard

**Retry fallback entries** retries saved `morning-pages-fallback` and older `local-fallback` results. **Analyze changed** also includes every legacy-date record, regardless of its previous analyzer, when Groq is enabled. Legacy recovery reads its saved source notes rather than substituting unrelated notes created on that calendar date, and keeps the legacy date label. Missing/empty sources and failed/provider-paused retries keep the existing result unchanged. A connected provider status does not mean cached history has already been reanalysed; the dashboard reports pending fallbacks. No automatic/startup analysis preference is enabled by this recovery change.

The dashboard is designed for vertical scrolling only. Charts redraw for the note pane's width with readable axes and fewer date labels when space is tight; no data points are dropped. Day-by-day cards wrap scores, emotion labels, analyzer/date-basis badges, and the complete summary rather than forcing a wide table or truncating text. Controls and settings also reflow based on their own pane, not the overall application window.

Existing plugin-owned dashboard notes have only their exact Base embed replaced by a link; custom writing and metadata are preserved. The optional native Base table remains available as a separate Obsidian view with its own table behavior, but it is no longer embedded in the dashboard.

Morning Pages fallback analysis is the default. Automatic note watching and startup analysis are off for new installs. Enabling Groq can send the cleaned text from every eligible note in an analyzed date group or saved legacy-date group to Groq; review the opt-in settings before running a full scan. Text below the minimum evidence threshold remains marked insufficient without scores.

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

## Analysis methods and licenses

- **Groq (opt-in):** Uses the 28-category [GoEmotions](https://github.com/google-research/google-research/tree/master/goemotions) taxonomy as an emotion vocabulary, with instructions to assess the author's own feelings and abstain when evidence is absent. This is prompt guidance, not the GoEmotions trained model.
- **Morning Pages fallback:** Uses a bundled copy of the built-in feelings and topics lists and word matcher from Morning Pages Analytics. Positive and negative feeling counts determine mood; joy, pride and sadness counts estimate energy; affection and relationship topic counts estimate connection; and feeling-word counts estimate intensity. With no matching words, mood, energy and connection default to 3 and intensity to 1. These simple counts do not interpret negation or attribution and have low confidence. The other plugin need not be installed; its customized word lists are not shared.
- Morning Pages Analytics is Copyright 2026 Remriel and licensed MIT; its license is included in `src/vendor/MORNING-PAGES-LICENSE.txt` and the bundle. The retained VADER library is Copyright 2018 Comcast Cable Communications Management, LLC, licensed Apache-2.0; its full license is included in `src/vendor/APACHE-2.0.txt` and the bundle.
- Existing Groq and older local-engine results remain cached for unchanged source text until explicitly reanalyzed. Current Morning Pages fallback and insufficient-evidence results can refresh on the next authorized scan when relevant local scoring settings change.

## Data lifecycle

- Disable **Analyze note changes automatically** to stop automatic refreshes.
- Disable **Enable Groq analysis** to keep subsequent analysis local.
- Set **Include folders** and **Exclude folders** to restrict future analysis and remote requests. Old records remain until you remove them.
- Delete `Mood History/` to remove generated Markdown and Base files.
- To reset cached history, disable the plugin and move monthly exports out of the configured history folder before deleting `data.json`; valid monthly recovery blocks are restored on the next startup.
- Generated entry files carry an ownership marker. If an expected entry path contains an unrelated note, the plugin creates a conflict-safe file instead of overwriting it.

## Reliability and rendering

Analysis caching uses a versioned fingerprint covering the source hash, text pipeline, analyzer/prompt/model, evidence thresholds and local topic semantics. Current Morning Pages fallback and insufficient-evidence records can be reevaluated when relevant scoring settings change. Earlier `local`, `local-fallback`, and Groq results remain intact for unchanged source text when Groq is disabled or the analyzer changes; changed text uses the current fallback or enabled provider. Existing Groq results also remain cached after prompt/model changes until you explicitly retry them or analyze the active note; changing a model alone does not spend provider quota. Records without fingerprints keep their historical provenance and result until source changes or explicit reanalysis; no missing provenance is invented.

Full scans build a temporary date-to-files index once. Source eligibility, file identity and metadata are checked again before reads and requests; changed scope cancels the scan. The index retains file references and paths only, and is discarded after each scan. It does not cache note text or reduce provider latency.

Generated provider summaries, drivers and confidence explanations are bounded plain text. Markdown punctuation is serialized as literal characters and line breaks are collapsed, so narrative fields cannot create links, images, embeds or HTML. Intended source-note links remain available separately. Summaries and confidence explanations are limited to 500 characters; each of up to four drivers is limited to 250 characters. Native Obsidian 1.14.4 synthetic checks verify literal readable output with no narrative link/image/embed/script elements.

Empty, standard Markdown image-only, wikilink image-only, HTML image-only and frontmatter-only notes provide no written evidence. Morning Pages fallback uses English feelings and topics word counts, without speaker attribution, contextual reasoning or negation handling; confidence remains low.

## Development

```bash
npm ci
npx playwright install --with-deps chromium webkit
npm test
npm run test:mobile
npm run test:layout
npm run test:mobile-layout
npm run audit:release
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

### Exploring the trend

Each score has its own labeled plot with a solid line, making trends easier to follow without overlapping series. The trend uses calendar spacing, so a longer gap between recorded days occupies more space. Lines connect recorded scores; they do not estimate scores on unrecorded days. If a recorded day has no score for a metric, its line breaks at that day. Choose **7 days**, **14 days**, **30 days**, **60 days**, **90 days**, **180 days**, **1 year** (365 days), or **All** to change the chart window. In settings, choose an opening range or **Last used** to reopen your previous preset or custom dates. A new install starts at **14 days** until you choose another range. Windows end on the latest scored day, even if it is not today, and include that day. The average-score tiles and Days scored tile above the chart follow the selected range; history continues to show all records.

Use the **Explore a recorded day** slider with a keyboard or touch, or select the chart, to inspect the date and all four values. The guide and highlighted points mark that day, and each plot shows its selected value at the upper right. The selected range is kept across dashboard redraws; the selected day resets to the latest visible record. Series visibility is saved separately.

### Chart series visibility

Click a series label in the chart legend to show or hide its line and points. All four series start visible. The selected visibility is saved across refreshes and restarts; this changes only the chart, never scores or analysis. Keyboard users can Tab to each button and use Space or Enter.

## More Obsidian projects

- [Untitled Auto Title](https://github.com/remriel/obsidian-untitled-auto-title): generate meaningful filenames from untitled Markdown notes.
- [Acid Xerox](https://github.com/remriel/acid-xerox-theme): a colorful, 90s-inspired Obsidian theme.

<a href="https://buymeacoffee.com/remriel"><img src="https://cdn.buymeacoffee.com/buttons/v2/default-yellow.png" alt="Buy me a coffee" width="110"></a>


### Date detection and existing history (1.7.4)

Filename dates are recognized in any included folder using the configured Daily Notes format and common numeric and English month-name formats. Ambiguous numeric dates are skipped. Undated names use local creation time.

Run **Analyze changed** after updating to build the detected-date history. Previous creation-date results and their Markdown files are preserved in **Previous grouping history**, excluded from current charts and averages. New results are analyzed from their actual sources; old scores are never moved or split between dates. Renamed, deleted or excluded sources also place outdated results in that section until reanalysis. Existing automatic-analysis and Groq consent settings still apply.


Choose **Custom** in the trend ranges to apply inclusive start and end dates. The trend, summary tiles, and composition use that interval. A redraw keeps the selection; a newly opened dashboard follows the configured default or last used range.

Common Emotions follows the selected range. **Composition over time** uses the ten most common emotions across all saved, scored history, including older records, so its legend stays fixed when the range changes. Daily columns in the 7–90 day ranges meet without gaps; longer ranges group dates into calendar periods. Percentages use only the ten displayed emotions in each period; remaining labels are excluded. Exact counts and percentages are available under **Period details**, and a period without any displayed emotion has a neutral gray placeholder.


Composition uses ten distinct pastel colors for the displayed emotions. A label keeps its color when the same labels change rank; if the global top ten changes as history grows, colors may be reassigned to keep all visible categories distinct. The chart and legend use matching colors even with themes that style SVG graphics. Textual period details make the values available without relying on color alone.
