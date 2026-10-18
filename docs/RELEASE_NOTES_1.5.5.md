# Automatic Mood History 1.5.5 — Local Moodring cross-check

- Optional *trained* Moodring 28-category GoEmotions-compatible classifier, operating entirely offline, alongside Groq and VADER.
- Separate `moodring-model.bin` binary asset, built by the release workflow from pinned MIT-licensed Moodring source and Google's labeled GoEmotions data.
- Preserve original Groq interpretation as primary. Moodring never changes the original scores, emotion tags or provider confidence.
- Enrich unchanged records locally without another Groq request, with model checking, abstention and capped analysis of long journal text.
- Validate binary format, bounded metadata, stored records and privacy boundaries; keep sidecar disabled unless explicitly enabled.

Install `moodring-model.bin` alongside your usual three plugin release files, turn on **Enable offline Moodring comparison**, check the model and analyze changed notes. Back up your vault and history before installing.
