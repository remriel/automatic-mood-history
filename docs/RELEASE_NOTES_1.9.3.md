# Recover saved history without repeated analysis

Automatic Mood History now completes interrupted monthly exports in batches. It restores existing history from monthly notes first, then saves the already-computed results without calling Groq again. This addresses large backlogs that could make Obsidian lag on startup.

If a monthly note contains personal edits, the plugin keeps that note intact and makes the computed scores available in its JSON history. The dashboard shows an export warning. To refresh that month, move the edited monthly note aside and choose **Export months**.

Ordinary scans skip unchanged note reads when file metadata is unchanged. A source event triggers an immediate check, and a full content check still runs at least daily to catch sync changes. Saved fallback scores are not upgraded by ordinary scans unless a retry is already pending; **Retry fallback entries** and **Retry all with Groq** remain available for explicit upgrades.

Automatic recovery handles at most five pending provider retries per pass, then continues on later passes. This keeps a large older backlog from monopolizing Obsidian.
