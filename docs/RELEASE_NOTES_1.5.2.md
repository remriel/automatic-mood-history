# Automatic Mood History 1.5.2 — Restore the 1.2.9 codebase

This is an intentional rollback release. It restores the exact plugin implementation from the original **1.2.9** Git tag (`de5ecc7be405868cb0079fedd89456ca32712bec`) and publishes it under version **1.5.2**.

## What changes

- Revert source code, bundled plugin logic, interface styling, build/test scripts, and dependencies to their 1.2.9 state.
- Remove the analysis, Groq chunk-processing, scoring, and dashboard changes introduced in versions 1.3.0 through 1.5.1.
- Change only release metadata and notes: plugin/package/lock versions, Obsidian compatibility map, and changelog.
- Preserve the plugin ID `automatic-mood-history` and the minimum Obsidian version 1.5.0.

## Data precautions

Before updating, back up the vault, especially the plugin settings and saved history in `.obsidian/plugins/automatic-mood-history/` and any generated Mood History entries. Version 1.2.9 predates data and processing changes from later releases; reading or resuming state written by 1.3.0–1.5.1 has not been verified. Keep a copy of those files for recovery.

This release changes application code. It does **not** run any migration or delete stored history.

## Verification scope

The restored 1.2.9 test/build/release pipeline runs for this version. Successful automated checks do not establish compatibility with private vault data or previously pending Groq jobs created by later versions.
