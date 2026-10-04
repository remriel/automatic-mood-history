# Project Progress

## Current objective — eliminate horizontal scrolling, install, and publish 1.2.2

**Progress: 85%**

- [x] Read continuity, inspect Git changes, locate public source and live 1.2.1 installation.
- [x] Reproduce chart/table overflow and identify the embedded Base and window-only breakpoint problems.
- [x] Implement pane-responsive charts, history cards, controls/settings, and safe dashboard migration.
- [x] Pass core/provider/migration regressions and browser layout tests; inspect screenshots.
- [x] Back up/install without replacing data; verify native startup/layout and preserved record dates/settings.
- [ ] Synchronize GitHub/release assets; verify CI and hashes.

The source started with uncommitted 1.2.1 Groq recovery work below. Preserve it; 1.2.2 includes those fixes instead of resetting the dirty tree. The live installed version is 1.2.1, not the stale 1.2.0 in the previous snapshot. No private-note analysis is required. See `docs/LAYOUT_QA.md` for coverage.

Verified: `npm test` passed the build and core/startup/timestamp/provider/migration tests. `npm run test:layout` passed light/dark 240–1440px panes, 200% text, long unbroken content, empty/insufficient/one-day and 365-day history, button/settings/link interactions, SVG label bounds, and observer cleanup. Wide and 390px fixture screenshots were reviewed; fixture data is fictional. Native install/reload and publication are next.

Native 1.2.2 started successfully and rendered the new cards in the user's theme. The installer replaced only the three release code files and proved `data.json` unchanged at copy time. Settings and all record dates are preserved. The user explicitly ran analysis during native verification; retain the updated results, not the backup's older analysis. Prior-scope records stay unchanged. Native screenshots/backups are private. The app was subsequently closed; the full narrow-pane matrix is browser-fixture evidence, not a claim of native measurements at every width.

## Previous staged 1.2.1 work (preserved)

- [x] Reconcile source, Git state, installed provider diagnostics, and current settings.
- [x] Identify the rejected schema field, incomplete-output handling, broken manual retry, and stale failure notices.
- [x] Repair provider requests, output validation, retry state, and local-analysis labels.
- [x] Add focused provider recovery regressions and pass the required build/test suite.
- [x] Install while preserving data and preferences; verify a live Groq response and Obsidian startup (included in 1.2.2).
- [x] Capture the dashboard in dark mode.
- [ ] Push, publish 1.2.2 (superseding staged 1.2.1), verify CI and asset hashes.

The earlier provider failure was HTTP 400 rejection of `uniqueItems`, followed by unusable fallback output. The staged repair is preserved and included in 1.2.2; current installation is 1.2.2.

The 1.2.1 source removes the rejected constraint, supplies schema instructions before the user text, uses low GPT-OSS reasoning without returned reasoning, and retries completion-limit exhaustion once with a larger budget. It validates required result fields, keeps valid unchanged Groq records on a failed retry, serializes date analysis, honors Retry-After, and reports per-run results. A sample-text connection check and visible provider status are implemented. `npm test` passed all existing tests and the new provider recovery suite.

## Completed 1.2.0 milestone

- [x] Replace Daily-folder, filename, and frontmatter date discovery with all-vault Markdown grouping by Obsidian creation timestamp.
- [x] Exclude generated history and trash notes; keep created-date grouping stable when notes are renamed.
- [x] Preserve previous records with a visible legacy date basis.
- [x] Remove obsolete Daily-folder settings and update dashboard, methodology, privacy, and README text.
- [x] Add tests for all folders, timestamp dates overriding titles/frontmatter, exclusions, note grouping, and legacy record preservation.
- [x] Pass the full local test suite and bundle build.
- [x] Install `1.2.0` without replacing `data.json`; verify a fresh Obsidian launch, timestamp-grouped scan, and legacy-record preservation.
- [x] Push to GitHub, confirm CI, tag `1.2.0`, and verify release assets.

## Current implementation state

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.2.0` is published at `https://github.com/remriel/automatic-mood-history/releases/tag/1.2.0`. The tag points to code commit `5fd02b1c836245c3ce0a2e2190b18b7c41934e7e`. Version 1.2.0 is installed and scanned in Obsidian.

## Current blockers

No access blocker. The provider fix and live verification are in progress.

## Verification performed

- Official Obsidian API declarations define `TFile.stat.ctime` as a millisecond creation timestamp.
- The new timestamp regression test confirms that folder, filename, and frontmatter dates do not override `ctime`; notes from multiple folders are combined, while generated output, trash, non-Markdown files, and timestamp-less notes are skipped.
- The regression test verifies that unchanged legacy analysis is relabeled without rewriting its generated entry or discarding its result.
- `npm test` passed: bundle build, syntax checks, core tests, bundle-load test, startup regression, timestamp grouping, and Groq fallback.
- A fresh Obsidian launch reports runtime version `1.2.0 / loaded`; the live scan grouped all Markdown notes from the Obsidian API by `ctime`, retained prior records as legacy, and reported no plugin errors.
- GitHub CI run `37059163020` and release workflow `37059296342` passed. The published `main.js`, `manifest.json`, and `styles.css` hashes match the source build and installed files.

## Exact next steps

1. Commit/push the completed 1.2.2 source and tag the exact manifest version.
2. Wait for CI/release, download the three assets, and compare their hashes with the build/installation.
3. Record final release evidence and update continuity.
