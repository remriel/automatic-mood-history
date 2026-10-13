# Synthetic native Obsidian QA

Date: 2026-10-13. Runtime: Obsidian 1.14.4 on Windows. Only a disposable vault and an isolated --user-data-dir profile are used. No installed personal plugin/data is accessed. Screenshots and vault files remain outside the public repository. No live Groq call is made; provider tests use fictional stubs.

## QA inventory

- Fresh install and upgrade/reload: default local/manual mode, registration, retained history and settings.
- Dashboard: open command, Analyze changed, entry links, four chart visibility controls, hide/show cycle, narrow pane/dark theme and no horizontal overflow.
- Settings: include/exclude/output/model/remote/automatic/startup controls, invalid scope preservation and save failures.
- Failure paths: scope change during an awaited read, owned-path collision, simulated unavailable cloud source, interrupted pending write and reload recovery.
- Narrative: links, remote images, wiki embeds, HTML, multiline lists, code fences, long fields; inspect actual preview DOM and readable text. Source links remain intentional.
- Exploratory cases: leave all series hidden then restore; retry a storage interruption after editing the original note; separate same-date legacy/current links.

## Evidence obtained so far

The plugin registers and opens via the native command palette. A normal Analyze changed click creates a local result from the single fictional source. Local/manual defaults are verified. Narrative preview renders the synthetic Markdown/HTML/link/embed strings literally: zero image, embed, link or script elements in narrative content, with punctuation readable in the visible text. Raw comparison and final dashboard/failure checks are being completed; see PROGRESS for final evidence.

## Limits

This simulates unavailable cloud reads, not a real cloud-sync provider. API fault injection covers storage boundaries without testing power-loss durability. Screenshots are inspected locally and are never added to the public repository. Native release installation, real provider account behavior/quota and private extensions are separate milestones.
