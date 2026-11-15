# Morning Pages fallback and dashboard updates

Automatic Mood History now uses bundled Morning Pages Analytics feelings and topics word lists to score new or changed writing when Groq is disabled or unavailable. Existing Groq and older local scores remain unchanged for unchanged writing. Groq retry backoff remains in place, and saved fallback results can be retried with Groq.

Fallback scores have low confidence. The bundled matcher uses built-in word lists, does not use another plugin's custom lists, and does not account for negation, quotations, or who a feeling belongs to. It is a lightweight estimate, not a contextual reading.

The dashboard now offers a 180-day trend range. Selected preset and custom ranges survive automatic redraws, while a newly opened dashboard still starts at 14 days. A dashboard remains registered through temporary DOM detachment until its Obsidian component unloads. Composition charts show gray columns for every period without a top-ten emotion and period details distinguish an empty period from scored records with no displayed emotion.

The task wording “Grok” was interpreted as **Groq**, the provider already used by this plugin. This release does not add xAI Grok support.

Automated checks use synthetic notes and a stubbed provider. Browser layout, native Obsidian behavior, and a live Groq request were not verified for this release.
