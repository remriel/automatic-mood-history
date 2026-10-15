# Automatic Mood History — project state

## Current objective and status (2026-10-15)

Substantially redesign the emotional analysis algorithm, validate contextual inference and uncertainty, preserve reliability/privacy/compatibility, and publish release 1.3.0. Implementation and local verification are complete; GitHub review/CI/publication and provenance checks remain. Branch: feat/contextual-emotional-analysis. Baseline: aea50c20f4916592570876a0aaeb0c3dcf9940f0 (completed release 1.2.9).

No subagents, private vault inspection, personal installed-plugin modifications or live provider calls were used. Only synthetic fixtures and attributed public-domain excerpts are in this repository.

## Architecture and decisions

- Desktop Obsidian CommonJS plugin. scripts/build.js bundles src/emotional-engine.js, src/sentiment-core.js and src/main.js into tracked main.js without production dependencies. LF normalization and .gitattributes make generated assets reproducible across checkout platforms.
- src/emotional-engine.js owns context-first local inference, bounded insight normalization, strict provider evidence validation and local historical comparison. src/sentiment-core.js keeps preparation/hashing, backward-compatible exports and safe Markdown serialization. src/main.js keeps source scope, lifecycle, settings, provider calls, storage, ownership and dashboard behavior.
- ENGINE_VERSION is contextual-evidence-v2; provider prompt is evidence-context-prompt-v2; text pipeline is markdown-text-v3. The old global lexicon-frequency implementation is removed. ALLOWED_EMOTIONS remains exported for compatibility; natural provider emotion labels are still supported within bounds.
- Four score keys remain, with null for unsupported dimensions. Scores balance distinct concept contributions, not token totals; intensity reflects expressed state/modifiers. Mixed feelings and temporal changes retain their evidence. Local confidence stays low; signal/dimension support is separate and not a probability.
- insights.version=1 is additive to history schema 2. At most 16 240-character signal quotes, eight observations with up to three 240-character quotes each, and bounded limitations are retained. Character spans refer to cleaned text. Explanations and all quote surfaces are inert text.
- New remote results require insights; malformed/fully ungrounded evidence or directional score conflicts remain pending and preserve earlier results. Unsupported axes are unscored. Provider summaries/observation descriptions/limitations are replaced by deterministic evidence-based explanations, with confidence capped and diagnostic state labels rejected. Exact quotation checks cannot prove semantic correctness.
- History comparisons use saved compatible evidence locally: same scope, engine generation, model, provider and date basis; at most 14 earlier observed dates within 30 days. Three dates are required for recurrent emotion or exact event/state wording. Comparisons are low-confidence analysis-time snapshots; no gaps are imputed and earlier writing never becomes extra remote context.

## Preserved reliability and privacy constraints

- Manual/local defaults, Groq opt-in, fixed GROQ_API_KEY environment lookup and provider-only failure semantics remain. Do not restore local fallbacks when Groq is enabled, configurable environment-variable names, or automatic opt-in defaults.
- Source dates use local TFile.stat.ctime; include/exclude rules and generated/trash exclusions apply. One unreadable source blocks its whole date. No partial legacy-source scoring.
- History schema 2 separates creation-date and legacy collisions. Preserve record keys, original paths, links and provenance. Do not downgrade and analyze schema 2 data with version 1.
- analysisQueue, analysisEpoch/guards and per-scan source index remain. Prepared result journaling and serialized detached JSON commits recover across Markdown/JSON interruptions. Edited owned notes receive separate recovery entries. See PERSISTENCE_PROTOCOL.md and HISTORY_IDENTITY.md.
- Folder/path validation fails closed; unreadable settings storage is not overwritten. No private workspace paths, source notes, credentials or native screenshots belong in the public repository.
- Evidence quotes are a documented privacy change: generated JSON/Markdown and local comparison snapshots intentionally contain short source excerpts, which vault sync/backup may copy. Excluding a source does not retroactively delete saved history.

## Verification and important discoveries

- Full functional suite including new emotional engine/integration/history cases passes locally on Node 24.19.0. Existing storage, cancellation, history identity, scope and provider retry tests continue passing.
- 78 synthetic challenges and eight source-verified public journal excerpts pass their broad textual constraints. Baseline passes 7/78 and 1/8 whole cases respectively; supported direction/range constraints improve 29/60 to 60/60, required abstentions 0/136 to 136/136. These are developer-labelled engineering checks used in development, not clinical or held-out validation.
- Counterfactual attribution, exact spans, negation, quote masking, mixed/temporal interpretations, repeated-clause/abstract-decoy invariance, provider evidence/score direction, malformed output, persistence/restart and sparse-history isolation pass. See docs/EMOTIONAL_ENGINE.md and docs/EMOTIONAL_BENCHMARK.json.
- Responsive browser tests pass, including expanded evidence at 240px and 200% text, missing axes and inert hostile markup. This is bundled browser QA, not native Obsidian QA. npm audit has zero known advisories; release privacy audit passes.
- Performance is not identical to the old count model. Median diverse-clause processing is 4.22ms/5,000 characters, 20.18ms/60,000 and 69.96ms/200,000 on this host; the large stress maximum was 109.48ms. Repeated/unbroken samples are faster than the baseline. No new I/O, production dependency or global text cache is introduced.

## Limits, assumptions and approaches not to repeat

- Do not claim psychological/clinical accuracy from the small benchmark. Historical translated journals differ from contemporary personal writing. Rule weights are engineering assumptions; unfamiliar idioms, subtle irony, metaphor, multilingual phrasing and ambiguous subject ownership can be missed.
- A word-count ratio, emotional vocabulary density, profanity or punctuation is not a valid substitute for contextual evidence. Social presence is not felt connection; an activity is not energy; wishes are not fulfilled needs. A copied quote alone does not validate an interpretation.
- Do not mechanically invert negation/sarcasm, invent underlying motives or diagnoses, or infer stable psychological patterns from a single event. Explicit needs and self-reported recurrence are safer than hidden-motive interpretations.
- Do not add earlier days' notes or saved excerpts to Groq context without a separate explicit design/consent decision. Local snapshots may become stale after prior records change; explicitly reanalyze later records to refresh.
- Existing Methodology notes are preserved on upgrade. README and EMOTIONAL_ENGINE.md describe the new engine. No new native Obsidian or live Groq semantic evaluation was performed.
- Obsidian provides no cross-file transaction/fsync guarantee; the existing prepared-write replay protocol is the recovery mechanism. Already dispatched requests cannot be recalled after opt-out.

## RESUME HERE

Inspect Git status/diff and docs/PROGRESS.md. Source and local validation are complete for 1.3.0. Finish GitHub PR/CI, merge/publication, download and compare release assets, verify source-bound GitHub attestation, then replace this pending status with exact release evidence. Do not rebuild scope or redo the completed 1.2.9 reliability work. Keep final PROGRESS.md and PROJECT_STATE.md in the repository and provide output copies to the user.
