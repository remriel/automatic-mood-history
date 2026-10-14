# Automatic Mood History 1.2.9

This release hardens history writes, cancellation and vault path handling while preserving local-first defaults and existing records.

## Reliability

- Stage validated analysis results durably before writing entry Markdown, then commit JSON and clear retry state together. Interrupted writes recover without another Groq request when the prepared result was saved.
- Preserve user or sync edits encountered during recovery by writing the recovered result to a separate generated entry.
- Serialize plugin data saves and publish detached, ordered snapshots so concurrent settings and history writes cannot overwrite each other.
- Cancel queued and in-flight analysis after settings, consent, source-scope, or unload changes. Coordinate sample checks with date analysis and report cancelled scan groups.
- Recover prepared results after startup. Keep manual-only and startup-only preferences separate from continuous automatic analysis.

## Privacy and storage validation

- Validate saved settings, records, retry metadata, chart preferences and vault-relative paths. Malformed source scopes pause analysis instead of becoming unrestricted. Invalid edits retain the last valid scope.
- Reject path traversal, absolute paths, malformed output roots, Obsidian configuration/trash folders and unsafe stored entry paths.
- Fingerprint source and analyzer semantics. Local topic/scorer/threshold changes recalculate on an authorized scan; unchanged Groq history waits for explicit reanalysis after model/prompt changes.
- Bound provider narrative fields and render them as plain text, preventing narrative-generated Markdown links, images, embeds and HTML. Ignore empty, frontmatter-only and image-only notes as evidence.

## History and performance

- Preserve creation-date and legacy-date groups on the same date with additive schema 2 identities. Retain original source paths, labels, entries and dashboard links.
- Enumerate the vault once per full scan and recheck scope/file identity before each read. Keep the index temporary and exclude note text from the cache.

## Verification

- Functional, storage interruption, lifecycle, settings/path, history identity, narrative, and responsive layout tests pass.
- Synthetic scan benchmark matches all source sets and hashes. For 10,000 notes across 365 dates, vault enumerations fell from 366 to 1 and measured discovery/gathering median fell from 6,016 ms to 797 ms; source reads remained 10,000.
- Native Obsidian 1.14.4 checks used an isolated synthetic vault and profile. Local/manual analysis, dashboard controls, and narrative rendering passed; no live Groq request or personal vault was used.

See `docs/PERSISTENCE_PROTOCOL.md`, `docs/HISTORY_IDENTITY.md`, and `docs/NATIVE_QA.md` for implementation details and verification boundaries.
