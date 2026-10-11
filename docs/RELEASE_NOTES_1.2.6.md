# Automatic Mood History 1.2.6

Fixes missing new entries when a Groq result uses a natural emotion label outside the old fixed vocabulary, or when a source note is temporarily unreadable.

- Accept bounded natural-language emotion labels while still requiring complete, valid scores and analysis fields. Preserve provider labels instead of inventing replacement emotions.
- Isolate invalid output and source-read failures to the affected date. Continue processing other dates; never analyze only part of a date's source files.
- Persist pending date groups with retry backoff. When automatic analysis is enabled, retry pending groups and periodically reconcile changed notes, including startup catch-up.
- Continue honoring account-wide rate-limit, authentication, network, and service pauses. Preserve existing results and never substitute local scoring while Groq is enabled.
- Keep commands available if startup settings storage fails, recover from entry persistence errors, sanitize JSON parse failures, and report unsuccessful active-note analysis accurately.
- Show whether automatic analysis is enabled on the dashboard and explain pending source-file problems.

Automatic analysis and Groq remain off by default for new installations. Existing preferences are preserved. Automatic processing runs while Obsidian is open; enabling automatic analysis also catches up at startup.

Validation: synthetic provider and cloud-file failure regressions, durable retry/backoff and opt-out checks, existing core/lifecycle/provenance suites, release privacy audit, and light/dark responsive layout tests. No personal notes, saved mood results, API keys, or private archive features are included in this release.
