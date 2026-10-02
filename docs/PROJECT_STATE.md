# Automatic Mood History — Project State

## Architecture

- This is an Obsidian desktop community plugin. `scripts/build.js` bundles `src/sentiment-core.js` and `src/main.js` into the self-contained `main.js` loaded by Obsidian.
- `src/main.js` owns plugin lifecycle, date discovery, source events, settings, optional Groq requests, generated files, and the dashboard renderer.
- `src/sentiment-core.js` owns text cleanup, duplicate paragraph removal, SHA-256 hashing, local lexicon scoring, result validation, and generated entry Markdown.
- The default analysis scope is the configured Daily folder, initially `Daily`. Outside-folder dates and aliases require an explicit setting.
- Startup analysis, automatic note-change analysis, and Groq requests are off by default. Local scoring runs when a user requests analysis. Groq requires the settings opt-in and reads only `GROQ_API_KEY` from the Obsidian process environment.
- No API key value is stored. The user-selected environment-variable setting from version 1.1.0 is ignored and omitted from saved settings.
- Generated files live under `Mood History/` by default. Entries contain an ownership marker. If a date path belongs to another note, the plugin picks a conflict-safe name and stores that path so dashboard links remain correct.
- Mood scores are text-based inferences, not diagnoses or objective facts. Groq receives cleaned note text only after opt-in; file paths remain local.
- Dark-mode styles use Obsidian theme colors for surfaces, text, and borders, with vivid series colors and a low-contrast decorative grid.

## Design decisions and rationale

- Preserve daily-note source text. The plugin reads notes and writes only its own history, methodology, Base, and dashboard files.
- Keep local analysis usable without an API key or network access.
- Require two deliberate choices for remote analysis: enable Groq and run analysis or enable automatic analysis.
- Limit default discovery to the configured Daily folder so a date-like filename elsewhere is not silently treated as a daily journal.
- Validate and label analyzer provenance. Empty or image-only days stay `insufficient`.
- Treat generated history as sensitive. Exclude `data.json`, `.obsidian/`, and `Mood History/` from Git.
- Use synthetic test fixtures only. The public repository must not contain note excerpts, generated mood entries, vault backups, absolute vault paths, or credentials.

## Important discoveries and constraints

- Version 1.1.0 documentation promised opt-in Groq and bounded folder scope, but code defaults could scan on startup, analyze on note edits, and call Groq when the key existed. Version 1.1.1 aligns behavior with the privacy documentation.
- Version 1.1.0 exposed an editable environment-variable name. This is now pinned to `GROQ_API_KEY` so synced plugin data cannot select another process secret.
- An earlier test fixture contained a real-looking backfill date and derived mood values. It has been replaced with synthetic data.
- A fresh 1.1.1 launch logged `Plugin failure: automatic-mood-history Error: Folder already exists.` The failure came from support-folder creation during `onload`. Version 1.1.2 moves setup after Obsidian's layout-ready event, checks adapter state, and accepts only confirmed existing folders after a creation race.
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

- Release `1.1.2` is published and installed locally. A fresh Obsidian launch saved runtime version `1.1.2` with status `loaded`; the diagnostic stderr contained no plugin failure or support-folder error. Downloaded release assets match both the tested build and installed files by SHA-256.
- The new dark theme has not yet been inspected in the live Obsidian app.
- CI run `37054881647` passed on the 1.1.2 fix. Release workflow `37054950493` passed for release `1.1.2`.
- The Groq service and configured model can change independently of this plugin; local analysis remains available.

## RESUME HERE

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.1.2` is published and installed. The captured `Folder already exists.` failure was fixed by deferring support-folder setup until layout-ready and checking adapter state when Obsidian's file cache lags. Local tests, GitHub CI, the release workflow, asset hashes, and a fresh Obsidian startup passed. The live dark-theme appearance has not been visually inspected. Do not add vault records or personal settings to this public repository.
