# Recoverable entry writes

Plugin JSON is the authority for committed history. A version 1 pending write stores only the validated analysis result, selected entry path, output directory and hash of the entry text observed before replacement. It never stores source note text or credentials.

1. Prepare: persist the previous committed record plus the pending write before changing Markdown.
2. Apply: atomically replace Markdown only when it still matches the observed content hash. An already matching result is a successful idempotent replay. If a user or sync edited the note, select a new unused filename and durably update the journal before creating it; preserve the edited note.
3. Commit: persist the new record and remove its pending write/date retry together. Only then publish the record in memory.

Every JSON save uses one queue and a detached snapshot captured when the save starts. Commit projections and their in-memory publication happen inside that queue, so a settings save cannot overwrite a newer commit with an older record snapshot. A rejected save leaves the journal and old record in memory; a rejection after a physical save is also recoverable from either persisted state.

Startup resumes prepared results locally after layout readiness, without another provider request. Analysis also checks for a prepared result before gathering or requesting text. A changed output directory leaves the old operation pending until the original directory is selected; recovery never follows a journal into another directory. Cancellation prevents additional writes, retaining any durably prepared operation for a later authorized recovery. Writes already dispatched to Obsidian cannot be recalled.

The storage API does not provide fsync or cross-file transactions. This protocol recovers successful API writes and rejected/interrupted boundaries, assuming a successful JSON save survives restart. It cannot recover a provider response lost before the first successful prepare save; that case needs another request. Concurrent instances of Obsidian and external edits to plugin JSON are outside the single-instance save queue guarantee.
