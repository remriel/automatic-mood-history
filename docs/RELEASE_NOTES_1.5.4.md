# Automatic Mood History 1.5.4 — GoEmotions + local VADER

- Keep Groq as the opt-in primary analyst with the same configured model, key, validated schema and privacy boundaries.
- Guide Groq to the 28-label Google GoEmotions vocabulary while separating the author's feelings from quotations, other people's emotions and abstract topics. This does not run the GoEmotions trained model.
- Replace local mood-polarity counts with offline VADER Sentiment JS 1.1.3. Retain the existing low-confidence local heuristics for energy, connection, intensity and emotion labels.
- Bundle the VADER implementation and its Apache-2.0 license into the Obsidian release without any extra API, download or runtime installation.
- Version scorer and prompt fingerprints. Existing valid Groq results require explicit reanalysis to change.
- Add regression tests for local negation, taxonomy guidance and release bundling.

Back up your vault and history before upgrading, especially when migrating records created by 1.3.0–1.5.1.
