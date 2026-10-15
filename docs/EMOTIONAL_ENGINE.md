# Emotional engine 1.3: design, evidence and limits

## Critical assessment of 1.2.9

Baseline commit: `aea50c20f4916592570876a0aaeb0c3dcf9940f0`.

The old deterministic engine scored the entire text using positive/negative term ratios and independent lists for energy and connection. It counted topics, attributed speech, negation and personal experience together. Words such as “friends”, “alone”, “run” and “sleep” became proxies for felt connection or energy. Intensity depended on emotional word count, profanity and exclamation marks. Its explanations described counts, rather than the situations and feelings that supported a conclusion. A middle score was also used when there was no evidence.

The provider prompt had attribution instructions, but the response contract had no verifiable evidence. Longitudinal charts displayed numbers without checking whether two results had compatible inference semantics or whether a recurrent expression was actually present.

## Replacement algorithm

`src/emotional-engine.js` implements a deterministic, context-first English engine. This is an interpretable inference system, not a trained psychological model.

1. **Source preparation.** The existing per-date consolidation and hash pipeline remains. Frontmatter, images, URLs, headings, Markdown blockquotes and code are excluded. The local engine masks inline quotations without changing offsets. All quoted evidence refers to the cleaned submitted text, not character positions in the original vault file.
2. **Predicate context.** Sentence and coordinated-clause boundaries scope ownership and negation. Explicit first-person feelings and conservative diary fragments can supply evidence. Third-party attribution, active actions toward others, common hypothetical/future/distant-memory frames and intellectual discussion are excluded. A first-person essay about grief is distinguished from “I think I'm sad”. Negation removes a literal signal without inventing its opposite. Selected idioms such as “couldn't stop crying” are matched as complete concepts.
3. **Independent concepts.** Each state has separate contributions to mood, activation/depletion, felt connection and intensity. Fatigue alone supplies no mood score; social presence alone supplies no connection score; calm alone supplies no depletion score. Activation can coexist with exhaustion. Object motion, technical connection, physical injury and selected polysemous uses are excluded.
4. **Aggregation.** Repeated clauses and repeated concepts do not increase strength. For a signed dimension, the engine averages distinct concept contributions on each pole, then balances positive and negative poles. It maps the resulting value around 3 to the bounded 1–5 scale. Explicit weakening/strengthening modifies contribution and intensity. Intensity uses the strongest supported expressed state, not emotional word volume or punctuation. All these numeric weights are engineering assumptions, not clinically established coefficients.
5. **Abstention.** A dimension without evidence is `null`. Mood valence is `unknown` when mood is unsupported, and `mixed` when both mood poles are expressed. A day with no scored personal signals can be `insufficient` even when its writing is long. Needs or possible sarcasm can still be shown for an unscored entry.
6. **Nuance.** Observations distinguish ambivalence, activation/connection coexistence, an explicit earlier/later change, and unresolved contradictory claims. Selected sarcasm cues make literal positive language unreliable without automatically implying the opposite emotion. Explicit wants/needs, event-feeling associations and self-reported recurrence retain quotation anchors. Structural nuance is prioritized over a long list of trigger observations.
7. **Confidence.** Signal support and per-dimension support are separate from global confidence. Fragmentary/hedged evidence and opposed poles are tentative. Deterministic global confidence stays low. These categories describe the support and limitations of a textual interpretation; they are not probabilities of psychological truth.

Core exports and four score property names remain available. `localSentiment(text, topic)` delegates to the new engine. Existing local topic labels are preserved when there is a scored signal; a topic is not evidence for a score.

## Evidence contract and provider behavior

New records add `insights.version = 1`, with at most 16 signal quotations of 240 characters, eight observations with up to three 240-character quotations each, and bounded limitations. Signals name their dimension, direction, state and textual confidence. They carry exact start/end spans in the cleaned source text.

The Groq schema uses nullable scores and the evidence contract. All object fields are required and extra properties are disallowed in structured mode, following the [provider's structured-output contract](https://console.groq.com/docs/structured-outputs). Existing strict → JSON object → plain JSON retries and one completion-limit retry remain. Default model, request limits, serialization, cooldown and cancellation behavior are unchanged.

New remote responses must have correctly shaped evidence. Quotations must occur in the text actually submitted. Basic attribution, quotation and negation checks run locally around the cited span; a fully ungrounded response is rejected and remains pending without replacing an existing record. Missing axis evidence removes the corresponding score. A score pointing opposite to a one-sided evidence direction is rejected. Mood poles are retained as mixed valence. High evidence confidence is capped at medium, and incomplete/ambiguous coverage yields low global confidence.

New provider explanations do not persist unrestricted model summaries, observation descriptions or limitations. They are constructed from the retained state labels, quotations and bounded interpretation templates. Diagnostic labels are rejected as state labels. This limits unsupported narrative claims, but does not prove every model label or interpretation is correct. Historical records without the extension remain readable and retain their original narrative/provenance.

## Comparisons over time

`compareEmotionalHistory` never reads earlier notes or sends prior context to Groq. It uses already saved evidence only when source-scope fingerprint, analyzer generation, model, provider and date basis match. This avoids mixing a legacy date interpretation, a different model or an earlier source scope with the current result.

The comparison window is at most 14 unique earlier observed dates within 30 calendar days. A dimension needs a supported current score and at least one supported baseline point; a change is shown at an absolute difference of at least one scale point. Each comparison reports its dates and sample size. Repeated expressions and exact event/state wording require the current and at least two earlier dates. Wording matches are deliberately literal rather than embedding-based psychological guesses.

Comparisons remain low confidence, leave calendar gaps unfilled, and describe selected writing rather than continuous mood or causation. They are snapshots taken when the current entry is analyzed. Editing/reanalyzing earlier entries does not retroactively rewrite later snapshots; explicitly reanalyze the later entries to refresh them. Existing snapshots remain local and may contain sensitive earlier quotations.

## Benchmark methodology and results

Run `npm run benchmark:emotions`, or `node scripts/benchmark-emotions.js aea50c2 docs/EMOTIONAL_BENCHMARK.json`. The baseline is loaded from Git and evaluated with the same broad constraints as the replacement. Exact numeric psychological labels are deliberately not asserted where a direction/range or abstention is the defensible requirement.

The corpus includes 78 developer-authored synthetic challenges and eight attributed excerpts from actual public-domain journals: [Marie Bashkirtseff, translated by Mary J. Safford](https://www.gutenberg.org/files/13916/13916-h/13916-h.htm), and [Henri-Frédéric Amiel, translated by Mrs. Humphry Ward](https://www.gutenberg.org/files/8545/8545-h/8545-h.htm). Every excerpt was checked against its source on 2026-10-15 with HTML removal and whitespace normalization. They cover explicit distress, depletion, metaphorical self-description and abstract philosophical discussion. Sources, edition, location, licence and expected textual constraints are in `tests/fixtures/emotional-cases.js`.

| Evaluation | 1.2.9 baseline | 1.3 engine |
| --- | ---: | ---: |
| Synthetic cases meeting every stated constraint | 7 / 78 | 78 / 78 |
| Public journal cases meeting every stated constraint | 1 / 8 | 8 / 8 |
| Supported score direction/range constraints, both groups | 29 / 60 | 60 / 60 |
| Required abstentions for unsupported axes, both groups | 0 / 136 | 136 / 136 |

These are developer-labelled engineering constraints, not a blinded or held-out clinical evaluation. The corpus was used during implementation. Whole-case comparisons include features the baseline never implemented, so the separated score/abstention counts matter. The public sample is small, historical and translated. Passing all these cases does not establish general psychological accuracy, sensitivity, fairness or diagnostic validity.

Additional tests cover attribution/negation/quotation counterfactuals, exact spans, repetition and abstract-decoy invariance, observation prioritization, persisted abstention, restart compatibility, malformed provider output, fabricated quotes, score-direction contradictions, scope/model/basis isolation, sparse dates, bounded recurrence and preserving old records on provider failure.

## Performance

Offline Node 24.19.0 synthetic measurements use two warm-up iterations followed by seven measured runs. The table records the median from `EMOTIONAL_BENCHMARK.json`; these are local microbenchmarks, not whole-vault latency or provider latency.

| Input | 1.2.9 median | 1.3 median |
| --- | ---: | ---: |
| 5,000 characters, distinct task reflections | 0.83 ms | 4.22 ms |
| 60,000 characters, repeated journal clauses | 7.29 ms | 4.91 ms |
| 60,000 characters, distinct clauses | 7.84 ms | 20.18 ms |
| 60,000 characters, unbroken non-emotional text | 8.61 ms | 3.35 ms |
| 200,000 characters, repeated clauses | 29.96 ms | 7.10 ms |
| 200,000 characters, distinct clauses | 25.03 ms | 69.96 ms |

The richer context pass costs more on diverse long text. The maximum measured run for the 200,000-character diverse stress case was 109.48 ms. A combined concept matcher, direct-predicate fast path, per-call deduplication, bounded prefix/quotation work and bounded retained observations control the cost. There are no new production dependencies, model downloads, provider calls, note reads or global note-text caches. The default per-day character cap remains 60,000, and the existing one-enumeration source index is preserved.

## Release verification and remaining limits

Full functional tests, source/bundle syntax, browser layout and release privacy checks pass locally. Browser tests exercise actual bundled rendering/CSS in light/dark 240–1440px panes, 200% text, 365 dates, expanded evidence, unscored axes, literal hostile text, controls, links and cleanup. No horizontal clipping/overflow or browser errors were found. `npm audit` reports zero known dependency advisories.

This release does not claim new native Obsidian testing or live Groq semantic evaluation. Existing 1.2.9 reliability tests remain, and synthetic restart/provider tests cover the new data. Subtle irony, metaphor, indirect affect, unfamiliar vocabulary, multilingual writing, person/subject ambiguity and experiences outside the selected notes remain limitations. Source quotations and local history are sensitive; see `PRIVACY.md`. Existing Methodology notes are not overwritten on upgrade.
