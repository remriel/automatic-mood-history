# Automatic Mood History 1.9.5

This release reduces work when opening and refreshing a large mood history.

- Day-by-day records are grouped under collapsed month headings. Entry counts stay visible, and detailed score cards are created when a month is expanded. Existing record details and source links remain available.
- Filename date parsing is cached in a bounded cache keyed by the filename and relevant date settings. Built-in date-format parsing is skipped for ordinary undated titles, while a configured Daily Notes format is still checked.
- Opening an existing Mood History dashboard no longer checks or rewrites support files.

Scores, saved history, and source notes are unchanged. Native Obsidian performance has not yet been measured on a personal vault.
