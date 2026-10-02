# Automatic Mood History — Project State

## Architecture

- This is an Obsidian desktop community plugin. `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into the self-contained `main.js` loaded by Obsidian.
- `src/main.js` owns plugin lifecycle, date discovery, source events, settings, optional Groq requests, generated files, and the dashboard renderer.
- `src/sentiment-core.js` owns text cleanup, duplicate paragraph removal, SHA-256 hashing, local lexicon scoring, result validation, and generated entry Markdown.
- The analysis scope is every Markdown note in the vault. Each note is assigned to the local calendar day of Obsidian's `TFile.stat.ctime`; folder, filename, frontmatter dates, aliases, and later edits do not set that day.
- Generated files under the configured `Mood History/` output folder and notes in `.trash/` are excluded. Notes without a valid creation timestamp are skipped.
- Startup analysis, automatic note-change analysis, and Groq requests are off by default. Local scoring runs when a user requests analysis. Groq requires the settings opt-in and reads only `GROQ_API_KEY` from the Obsidian process environment.
- No API key value is stored. The user-selected environment-variable setting from version 1.1.0 is ignored and omitted from saved settings.
- Generated files live under `Mood History/` by default. Entries contain an ownership marker. If a date path belongs to another note, the plugin picks a conflict-safe name and stores that path so dashboard links remain correct.
- Existing records from prior filename/frontmatter grouping are retained with `dateBasis: legacy-note-date`; new or verified groups use `dateBasis: created-at-local-date`.
- Mood scores are text-based inferences, not diagnoses or objective facts. Groq receives cleaned note text only after opt-in; file paths remain local.
- Dark-mode styles use Obsidian theme colors for surfaces, text, and borders, with vivid series colors and a low-contrast decorative grid.

## Design decisions and rationale

- Preserve daily-note source text. The plugin reads notes and writes only its own history, methodology, Base, and dashboard files.
- Keep local analysis usable without an API key or network access.
- Require two deliberate choices for remote analysis: enable Groq and run analysis or enable automatic analysis.
- Group all Markdown notes by creation timestamp, not folder or note title, because the user's intended day is when the note was made.
- Preserve earlier records and label their old date basis instead of deleting or silently presenting them as timestamp-based.
- Validate and label analyzer provenance. Empty or image-only days stay `insufficient`.
- Treat generated history as sensitive. Exclude `data.json`, `.obsidian/`, and `Mood History/` from Git.
- Use synthetic test fixtures only. The public repository must not contain note excerpts, generated mood entries, vault backups, absolute vault paths, or credentials.

## Important discoveries and constraints

- Version 1.1.0 documentation promised opt-in Groq and bounded folder scope, but code defaults could scan on startup, analyze on note edits, and call Groq when the key existed. Version 1.1.1 aligns behavior with the privacy documentation.
- Version 1.1.0 exposed an editable environment-variable name. This is now pinned to `GROQ_API_KEY` so synced plugin data cannot select another process secret.
- An earlier test fixture contained a real-looking backfill date and derived mood values. It has been replaced with synthetic data.
- A fresh 1.1.1 launch logged `Plugin failure: automatic-mood-history Error: Folder already exists.` The failure came from support-folder creation during `onload`. Version 1.1.2 moves setup after Obsidian's layout-ready event, checks adapter state, and accepts only confirmed existing folders after a creation race.
- The user's corrected scope is all notes created on a day, using Obsidian creation timestamps. Version 1.2.0 implements local-day grouping from `TFile.stat.ctime` and no longer uses filenames, frontmatter dates, aliases, or Daily-folder settings.
- The release workflow validates that the pushed tag equals the manifest version and attaches `main.js`, `manifest.json`, and `styles.css`.
- The source folder initially had no Git metadata or remote. It is now the public repository `https://github.com/remriel/automatic-mood-history`; startup fix commit `929d5cb0b9f787b71ce902bb3877cf5cafffcf41` is on `main` and tagged `1.1.2`.

## Failed approaches not to repeat

- Do not publish the surrounding vault-work folder or its project notes. Publish only this sanitized plugin directory.
- Do not use the projectless workspace path ending in the reserved Windows name `con`; use the actual plugin checkout folder.
- Do not restore the old editable environment-variable setting or enable remote analysis for a fresh install by default.

## Relevant files

- `src/main.js` — plugin settings, scoped date discovery, opt-in Groq, conflict-safe entry writer, and dashboard links.
- `src/sentiment-core.js` — local analysis and entry rendering.
- `styles.css` — light styles and Obsidian-aware dark theme.
- `manifest.json`, `versions.json`, `CHANGELOG.md` — plugin versioning.
- `.github/workflows/ci.yml`, `.github/workflows/release.yml` — repository CI and tagged release.
- `README.md`, `PRIVACY.md`, `SECURITY.md` — user guidance and disclosure.

## Known limitations and unresolved items

- Version `1.2.0` is installed locally. A fresh Obsidian launch reports `loaded`; the live scan grouped notes by creation timestamp, preserved old records with the legacy marker, and had no plugin errors.
- The new dark theme has not yet been inspected in the live Obsidian app.
- CI run `37054881647` passed on the 1.1.2 fix. The 1.2.0 source push and release workflow are pending.
- The Groq service and configured model can change independently of this plugin; local analysis remains available.

## RESUME HERE

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.1.2` is the previous published version. Version `1.2.0` groups all Markdown notes by local day from `TFile.stat.ctime`, preserves old records as legacy, removes obsolete Daily-folder settings, passes local tests, and loaded in Obsidian with no startup errors. Push main, confirm CI, tag `1.2.0`, and verify release assets. Do not add vault records or personal settings to this public repository.
