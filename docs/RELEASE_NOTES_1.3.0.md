# Automatic Mood History 1.3.0

This release replaces the local engine's global word-count methodology with contextual evidence and independent emotional dimensions. It preserves local/manual defaults, existing history identities and source links, guarded persistence, and provider-only failures when Groq is enabled.

## Emotional interpretation

- Scope emotional signals to the writer's experience. Filter common attribution, quotations, negation, wishes, hypothetical states, distant memories and intellectual discussion, including first-person discussion of emotional topics.
- Score mood, energy, felt connection and intensity independently. Unsupported dimensions remain `null`; unscored writing is not plotted as a neutral mood.
- Retain competing feelings, activation alongside depletion, explicit temporal change and unresolved claims in tension. Mark possible sarcasm tentatively and avoid automatic inversion.
- Anchor explicit needs, event/feeling associations and self-reported recurrence to concrete source text. Do not infer hidden motives, diagnoses or personality traits.
- Use concept balance and expressed strength rather than word frequency, profanity or punctuation for scoring. Repeated emotional sentences do not create stronger scores.

## Evidence, privacy and compatibility

- Store bounded exact quotations, dimension/direction and textual confidence. Evidence and context appear in generated entries and an accessible expandable dashboard panel, including entries with no assigned scores.
- Require grounded evidence from new Groq responses. Check quotations and basic attribution locally, abstain on unsupported axes, reject directional contradictions, cap confidence and construct bounded explanations from validated signals.
- Compare only saved, compatible evidence locally across up to 14 earlier observed dates within 30 days. Three-date recurrence identifies repeated wording and feelings, without filling gaps or claiming psychological causation. Comparisons are analysis-time snapshots.
- Preserve record schema 2 identity, legacy results, privacy defaults, fixed environment-key handling, source scope, cancellation, retries and recoverable writes. Existing remote results are not refreshed solely by a prompt/model update.
- **Privacy change:** derived records now intentionally include short source quotations, and comparisons may repeat previously saved excerpts. Vault sync/backup can copy them. No additional note scope or previous-day context is sent to Groq. See `PRIVACY.md`.

## Evaluation

The offline suite includes 78 developer-authored challenge cases, eight attributed public-domain journal excerpts, attribution counterfactuals, exact-span assertions, repetition/decoy invariants, provider validation, persistence, history isolation, and browser layout checks. The measured before/after constraints and performance results are recorded in `docs/EMOTIONAL_ENGINE.md` and `docs/EMOTIONAL_BENCHMARK.json`.

The benchmark is small and developer-labelled, and historical translated diaries differ from contemporary writing. It demonstrates specified engineering behavior, not clinical accuracy. The English rule engine can still miss subtle implication, metaphor, cultural context and unfamiliar language. No live Groq semantic evaluation or new native Obsidian test was performed for this release.
