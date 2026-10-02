# Project Progress

## Current objective — group all notes by creation timestamp and release the update

**Progress: 80%**

- [x] Replace Daily-folder, filename, and frontmatter date discovery with all-vault Markdown grouping by Obsidian creation timestamp.
- [x] Exclude generated history and trash notes; keep created-date grouping stable when notes are renamed.
- [x] Preserve previous records with a visible legacy date basis.
- [x] Remove obsolete Daily-folder settings and update dashboard, methodology, privacy, and README text.
- [x] Add tests for all folders, timestamp dates overriding titles/frontmatter, exclusions, note grouping, and legacy record preservation.
- [x] Pass the full local test suite and bundle build.
- [x] Install `1.2.0` without replacing `data.json`; verify a fresh Obsidian launch, timestamp-grouped scan, and legacy-record preservation.
- [ ] Push to GitHub, confirm CI, tag `1.2.0`, and verify release assets.

## Current implementation state

The public repository is `https://github.com/remriel/automatic-mood-history`; release `1.1.2` remains published. Version `1.2.0` passes local tests and a fresh Obsidian scan, but is not pushed or released yet. Existing legacy records are kept and marked as prior-scope history.

## Current blockers

No code or real-vault blocker remains. GitHub CI and release publication are pending.

## Verification performed

- Official Obsidian API declarations define `TFile.stat.ctime` as a millisecond creation timestamp.
- The new timestamp regression test confirms that folder, filename, and frontmatter dates do not override `ctime`; notes from multiple folders are combined, while generated output, trash, non-Markdown files, and timestamp-less notes are skipped.
- The regression test verifies that unchanged legacy analysis is relabeled without rewriting its generated entry or discarding its result.
- `npm test` passed: bundle build, syntax checks, core tests, bundle-load test, startup regression, timestamp grouping, and Groq fallback.
- A fresh Obsidian launch reports runtime version `1.2.0 / loaded`; the live scan grouped all Markdown notes from the Obsidian API by `ctime`, retained prior records as legacy, and reported no plugin errors.

## Exact next steps

1. Push the tested code and confirm main CI.
2. Tag `1.2.0` and confirm all three release assets match source and installed files.
3. Update the private project handoff with the release results.
