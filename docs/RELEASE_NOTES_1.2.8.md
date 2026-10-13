## Automatic Mood History 1.2.8

### Folder inclusion and exclusion
- New **Include folders** and **Exclude folders** fields in Obsidian plugin settings, one vault-relative directory per line.
- Empty include list keeps the previous whole-vault behavior. Including a folder also includes its descendants. Excluding a folder overrides the include list.
- Use `/` to target Markdown notes at the vault root.
- Rules apply to manual scans, automatic changes, the active-note command, and legacy-source recovery. Excluded source files are never read for analysis.
- The plugin's generated output directory and Obsidian trash always stay excluded.
- Existing generated history is preserved when the scope changes. **Analyze changed** recomputes eligible dates. Previously stored history for days with no eligible sources must be removed manually.
- New test coverage checks precedence, prefix collisions, root-level notes, legacy recovery and source gathering.
