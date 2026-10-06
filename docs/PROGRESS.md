# Project Progress

## Current objective — fix release audit findings and publish 1.2.4

**Progress: [#################---] 85% - release findings fixed and local CI-equivalent checks pass; merge, tag, and release workflow remain.**

- [x] Reconcile repository, branch, and installed 1.2.4 state.
- [x] Remove "Obsidian" from the manifest description.
- [x] Remove the `text-decoration-thickness` compatibility warning and replace `!important` rules with scoped specificity.
- [x] Add versioned GitHub release notes and build-provenance attestations for all release files.
- [x] Pass `npm test`, `npm run audit:release`, and `npm run test:layout`.
- [ ] Commit and push these release fixes, then fast-forward `main`.
- [ ] Push tag `1.2.4`; confirm the GitHub release description, assets, and attestations.

The release checker flagged the manifest description, empty release body, absent asset attestations, and CSS compatibility/`!important` warnings. The fixes are in the existing 1.2.4 branch. Provider-only Groq and legacy-date recovery remain included. The public repository contains no vault records, note contents, keys, or absolute vault paths.

## Completed 1.2.2 layout milestone

- [x] Read continuity, inspect Git changes, locate public source and live 1.2.1 installation.
- [x] Reproduce chart/table overflow and identify the embedded Base and window-only breakpoint problems.
- [x] Implement pane-responsive charts, history cards, controls/settings, and safe dashboard migration.
- [x] Pass core/provider/migration regressions and browser layout tests; inspect screenshots.
- [x] Back up/install without replacing data; verify native startup/layout and preserved record dates/settings.
- [x] Synchronize GitHub and publish 1.2.2 through the existing tagged-release workflow.

The source started with uncommitted 1.2.1 Groq recovery work below. Preserve it; 1.2.2 includes those fixes instead of resetting the dirty tree. The live installed version is 1.2.1, not the stale 1.2.0 in the previous snapshot. No private-note analysis is required. See `docs/LAYOUT_QA.md` for coverage.

Verified before the user switched to Build Once & Publish: `npm test` and `npm run test:layout` passed core/startup/timestamp/provider/migration tests and light/dark 240–1440px panes, 200% enlargement, long content, dense/empty/insufficient/one-day history, controls, SVG bounds, and observer cleanup. Wide and 390px fictional-data screenshots were reviewed. Source/installed release files matched. No further validation was performed after the workflow change.

Release: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.2
Tag commit: `c11f60292e87729130bee48ffb4d84c8acf6b058`. Release workflow `37178543489` completed successfully and published the three assets. Post-publication hash downloads, browser checks, and further test passes were intentionally skipped at the user's request.

Native 1.2.2 started successfully and rendered the new cards in the user's theme. The installer replaced only the three release code files and proved `data.json` unchanged at copy time. Settings and all record dates are preserved. The user explicitly ran analysis during native verification; retain the updated results, not the backup's older analysis. Prior-scope records stay unchanged. Native screenshots/backups are private. The app was subsequently closed; the full narrow-pane matrix is browser-fixture evidence, not a claim of native measurements at every width.

## Previous staged 1.2.1 work (preserved)

- [x] Reconcile source, Git state, installed provider diagnostics, and current settings.
- [x] Identify the rejected schema field, incomplete-output handling, broken manual retry, and stale failure notices.
- [x] Repair provider requests, output validation, retry state, and local-analysis labels.
- [x] Add focused provider recovery regressions and pass the required build/test suite.
- [x] Install while preserving data and preferences; verify a live Groq response and Obsidian startup (included in 1.2.2).
- [x] Capture the dashboard in dark mode.
- [x] Publish 1.2.2, superseding staged 1.2.1; the existing release workflow succeeded.

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

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.2.2` is published and installed. Its tag points to `c11f60292e87729130bee48ffb4d84c8acf6b058`. Earlier milestone evidence below is historical.

## Current blockers

None for build, installation, or publication. Manual acceptance is now the user's responsibility; no further tests or polish are queued.

## Verification performed

- Official Obsidian API declarations define `TFile.stat.ctime` as a millisecond creation timestamp.
- The new timestamp regression test confirms that folder, filename, and frontmatter dates do not override `ctime`; notes from multiple folders are combined, while generated output, trash, non-Markdown files, and timestamp-less notes are skipped.
- The regression test verifies that unchanged legacy analysis is relabeled without rewriting its generated entry or discarding its result.
- `npm test` passed: bundle build, syntax checks, core tests, bundle-load test, startup regression, timestamp grouping, and Groq fallback.
- A fresh Obsidian launch reports runtime version `1.2.0 / loaded`; the live scan grouped all Markdown notes from the Obsidian API by `ctime`, retained prior records as legacy, and reported no plugin errors.
- GitHub CI run `37059163020` and release workflow `37059296342` passed. The published `main.js`, `manifest.json`, and `styles.css` hashes match the source build and installed files.

## Exact next steps

1. No implementation or publication work remains.
2. User: open the dashboard, narrow the Obsidian pane, and perform manual acceptance.
3. Make further changes only in response to a new request; do not resume validation loops.
