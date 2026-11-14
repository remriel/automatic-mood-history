# Recoverable entry writes

## Compact output (1.8.0)

Prepared writes record `entryOutput` (`daily`, `monthly`, or `none`); older journals without the field retain daily semantics. Recovery requires the original output directory and mode. Settings refuse an output-mode change while writes are pending. Monthly mode writes the projected month's records before committing JSON; none skips Markdown but retains the prepare/commit protocol.

`buildMonthlyMarkdown` sorts keys deterministically, preserves historical record identities and includes complete JSON recovery data alongside readable daily sections. `writeMonthlyNote` atomically compares the full current document with the projected export, the prior records' export, or its saved export hash. A matching projection is an idempotent replay. Other content is preserved and causes a recoverable output failure. `runtime.monthlyExportHashes` tolerates metadata refreshes between exports without treating an ownership marker alone as permission to overwrite text. Export refreshes share the analysis queue and persist these hashes. No source analysis or provider call is needed to export.

The plugin never automatically removes old daily entries. Archive only after checking complete recovery data and retaining exact originals. Monthly recovery blocks do not yet have an automatic import UI. Multi-device concurrent writes retain the limitations below.

## Daily output

As of 1.8.2, prepare compares an existing entry with both the prior committed generated text and the new projected text, normalizing line endings for that comparison. An unrelated, orphaned or previously edited file is treated as a conflict and retained; recovery creates an unused entry instead. The exact observed hash still guards the actual write against later changes. The prepared record is a detached object, so an interrupted export cannot mutate the committed in-memory record before the JSON commit.

Switching to daily output restores each saved record through the same prepare/write/commit queue rather than directly overwriting owned files. The operation does not call a provider. If interrupted, its pending record can be replayed on restart; an export can be run again without duplicating unchanged notes.

Plugin JSON is the authority for committed history. A version 1 pending write stores only the validated analysis result, selected entry path, output directory and hash of the entry text observed before replacement. It never stores source note text or credentials.

1. Prepare: persist the previous committed record plus the pending write before changing Markdown.
2. Apply: atomically replace Markdown only when it still matches the observed content hash. An already matching result is a successful idempotent replay. If a user or sync edited the note, select a new unused filename and durably update the journal before creating it; preserve the edited note.
3. Commit: persist the new record and remove its pending write/date retry together. Only then publish the record in memory.

Every JSON save uses one queue and a detached snapshot captured when the save starts. Commit projections and their in-memory publication happen inside that queue, so a settings save cannot overwrite a newer commit with an older record snapshot. A rejected save leaves the journal and old record in memory; a rejection after a physical save is also recoverable from either persisted state.

Startup resumes prepared results locally after layout readiness, without another provider request. Analysis also checks for a prepared result before gathering or requesting text. A changed output directory leaves the old operation pending until the original directory is selected; recovery never follows a journal into another directory. Cancellation prevents additional writes, retaining any durably prepared operation for a later authorized recovery. Writes already dispatched to Obsidian cannot be recalled.

The storage API does not provide fsync or cross-file transactions. This protocol recovers successful API writes and rejected/interrupted boundaries, assuming a successful JSON save survives restart. It cannot recover a provider response lost before the first successful prepare save; that case needs another request. Concurrent instances of Obsidian and external edits to plugin JSON are outside the single-instance save queue guarantee.
