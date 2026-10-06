## Automatic Mood History 1.2.4

This release makes Groq-enabled analysis provider-only. When Groq is unavailable, paused, or returns unusable output, existing records are preserved and new or changed groups remain pending instead of receiving local fallback scores.

Groq scans now include legacy-date entries and read their original saved source notes while preserving their legacy date labels and entry paths. The **Analyze changed notes** command can refresh those records.

The plugin manifest description and stylesheet compatibility warnings are also corrected. Release assets are accompanied by GitHub build provenance attestations.
