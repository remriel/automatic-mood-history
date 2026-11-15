# Retry and threshold recovery fixes

When a Groq retry fails, Automatic Mood History now preserves any unchanged complete saved score regardless of which analyzer produced it. New or changed notes remain eligible for retry under the existing provider backoff behavior.

Lowering **Minimum characters** now reevaluates notes previously marked insufficient even when Groq is enabled, allowing eligible writing to be analyzed with Groq.

The regression tests use synthetic notes and a stubbed provider. Functional, mobile runtime, desktop/mobile browser layout and release privacy checks passed. Native Obsidian behavior and live Groq requests have not been verified for this release.
