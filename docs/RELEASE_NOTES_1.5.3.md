# Automatic Mood History 1.5.3 — Exempt no-evidence dates

This release builds on the restored 1.2.9 codebase and excludes categorically unscorable Groq assessments. Examples include “No explicit emotional content was provided” and “No content was provided for analysis.”

- All four score fields become null, and affected days are omitted from chart points, averages, scored-day counts and emotion tallies.
- Existing saved records receive the same rule at load, without further Groq requests. Generated plugin-owned entry notes are refreshed by the existing recoverable, conflict-aware writer; source notes are untouched.
- History cards continue to show affected dates with an insufficient-evidence explanation.
- Generic uncertainty, neutral moods and low-confidence assessments containing real emotional evidence remain scoreable.

Verification includes classification, provider-response and saved-history regressions plus the chart-layout test. Back up your vault and plugin history before installing, particularly if you have records saved by releases 1.3.0–1.5.1.
