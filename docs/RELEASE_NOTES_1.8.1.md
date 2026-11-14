# Settings UI width, daily export restoration and date ambiguity

The settings tab now expands to use the full modal width across desktop Obsidian themes, eliminating narrow constrained columns. Folder allowlists and excludelists span the full card width as responsive, vertically stacked multi-line editors, and text inputs and dropdowns expand proportionally with room for long model names, API keys and output paths.

Switching Markdown history output back to Daily notes from Monthly or Dashboard-only mode automatically exports daily entry notes for all saved records using the collision-safe entry writer, restoring entry notes and Bases support without requiring another provider analysis.

Filename date detection recognizes underscore-separated dates (e.g. `2024-03-04_2024-03-05.md`) and correctly flags them as ambiguous multi-date files rather than assigning them to the first date token.
