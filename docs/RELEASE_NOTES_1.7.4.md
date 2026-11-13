# Automatic Mood History 1.7.4

Automatic filename date detection now works in any included folder, using the configured Daily Notes format and the common date formats supported by Morning Pages. Ambiguous numeric dates are skipped; undated notes use their creation date.

## Existing history

Run **Analyze changed** after updating. Previous creation-date summaries and their generated Markdown files are preserved in **Previous grouping history** and excluded from current charts and averages. Detected-date groups use separate record identities and conflict-safe entry paths. Scores are reanalyzed from their actual sources, never copied or split. Failed requests preserve saved history, and interrupted writes recover without repeating a saved analysis. Renamed/deleted/excluded sources remove outdated groups from current charts until reanalysis.

Folder exclusions, manual/automatic preferences, and Groq consent remain respected. Supported date notation is the configured format plus common numeric and English month-name formats, not every imaginable date notation.

User will perform native Obsidian testing. No personal vault content is included in the release.
