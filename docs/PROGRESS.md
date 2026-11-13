# Automatic date detection

**Objective:** Group dated filenames from any eligible folder under their actual dates using Morning Pages automatic detection.

**Progress: 60% ? implementation and synthetic checks pass; safe existing-history migration and installation remain.**

- [x] Inspect installed Morning Pages 0.5.4 and current Mood History 1.7.3 source.
- [x] Implement strict filename detection with the same presets and Daily Notes format, ambiguity rejection, and undated creation-time fallback.
- [x] Pass full functional, mobile runtime, and release privacy checks.
- [ ] Design and test non-destructive migration of previously creation-grouped records and correct their provenance.
- [ ] Verify native behavior with synthetic data and preserve private installed extensions.
- [ ] Install and synchronize completed changes to GitHub.

**Blocker:** Old saved creation-date groups can remain visible or be partially recalculated when sources move. Installing now could misrepresent existing mood history. No changes were made to the user's installed plugin or data.

**Exact next steps:**
1. Inspect record identities, pending recovery, generated entry ownership, and handling of empty groups; design an explicit reversible migration that preserves original results.
2. Implement migration and update labels, methodology, and provider wording; cover mixed old/new dates, collisions, restarts, renames, exclusions, and provider failure.
3. Run all tests and native synthetic-vault checks; adapt the personal installed bundle without losing private extensions or saved data.
4. Review and synchronize the completed changes; verify installation and GitHub state.
`n## Prerelease publication`n1.7.4-beta.1 prepared as an explicitly limited testing prerelease. Functional/mobile/privacy checks passed again. Stable release and installed plugin remain unchanged; migration is still required for stable readiness.
`nPublished and verified: https://github.com/remriel/automatic-mood-history/releases/tag/1.7.4-beta.1 — GitHub reports isPrerelease=true and all three plugin assets uploaded. Tag commit 5e24cec. Remote release workflow verification remains pending.
