# Better settings proportions and safer history writes

Settings now size each row to its content on phones and narrow panes, instead of stretching text and controls into very tall blocks. Desktop descriptions receive more space while controls remain easy to use. Folder editors remain full-width, with at least 44px of height for buttons, text inputs and dropdowns.

Daily exports and reanalysis now preserve changes made to generated entries before processing begins. If an entry differs from the saved generated result, the plugin keeps it and writes a separate recovered entry. Daily exports use the same restart-safe pending-write protocol as analysis. Monthly and dashboard-only modes no longer pass an empty file path to Obsidian.

Date detection now considers every underscore-formatted date in a title; a filename with two different dates stays ambiguous. No saved scores are copied to a new date, and this update does not itself rerun analysis.

Validated with functional, recovery, date-parsing and privacy tests, plus responsive settings measurements and desktop/phone browser-layout tests. As with any backup, keep a separate copy of important history and verify your device sync.
