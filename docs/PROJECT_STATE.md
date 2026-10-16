# Automatic Mood History — project state

## Current objective and authorization

Address the two reported partially assessed dates (2026-10-08 at 18/19 chunks and 2026-10-13 at 9/10 chunks) and prepare a 1.5.1 recovery release. The dashboard's `output` reason means one chunk returned incomplete/invalid analysis or failed quote validation; the line alone does not identify the exact code. This checkout has no matching private runtime, so neither date's exact validation code was available. Do not start or resume private journal analysis. No subagents: the user's AGENTS instructions prohibit delegation without an explicit request.

## Architecture and important decisions

- Desktop Obsidian CommonJS plugin, no production dependency. `scripts/build.js` concatenates emotional-engine, sentiment-core, analysis-pipeline, groq-runtime and main into tracked `main.js`.
- `src/analysis-pipeline.js` prepares the complete eligible source, deterministic chunks, opaque passage identifiers, coverage, exact quotation validation and concept/pole aggregation. Local file paths stay local.
- `src/groq-runtime.js` owns the compact response schema/prompt/expansion and pure quota calculations. Four independent nullable scores, an explicit whole-chunk review acknowledgment, ambiguous axes and at most eight short exact evidence anchors replace verbose generated narrative and repetitive passage acknowledgment lists. Local expansion records assessed passage outcomes, computes quote offsets and builds grounded explanations. This acknowledgment is model-reported review, not independent proof of semantic completeness.
- `src/main.js` owns request reservations, bounded workers, cancellation, date scheduling, checkpoints, storage recovery and dashboard. GPT-OSS chunk requests use low reasoning, 1,536 output tokens with one possible 3,072-token truncation recovery. A chunk has at most two provider calls including format or evidence correction. Explicit abstention is valid; no routine heuristic second review.
- 1.5.1 repairs only unique quote matches differing in spacing or straight/curly quotation marks, then copies the exact source substring. Trimmed quote offsets are corrected before attribution checks; a score is unresolved if its normalized anchor disappears. Malformed successful HTTP responses remain date-specific `output` failures and safe diagnostic codes appear in Processing Status. Existing complete chunks are reused. `prepareSourceCoverage` uses a linear group index instead of repeated `indexOf`.
- Independent chunks within one date run in a quota-aware pool: one request discovers headers, then three or five workers when reported token capacity permits. Reserve estimated input plus output before dispatch. Unknown quota remains serial. Requests-per-day headers must never be interpreted as requests-per-minute. Token refill estimates, outstanding reservations, daily exhaustion and Retry-After constrain dispatch. Manual resume does not clear a provider pause. Estimated tokens are conservative but not an exact model tokenizer; provider 429 remains authoritative.
- Storage writes/commits remain serialized. One completed result checkpoint per chunk replaces redundant pre-dispatch saves; redraws are throttled and redundant staging mappings are rebuilt from fingerprint-checked source. Await in-flight workers during cancellation/fatal errors. Late responses must not clear another worker's provider pause.
- Resume pending retains its initial pending target set and drains productive character-limited batches immediately (bounded to 100 passes). The saved source-character cap still applies to each batch, including repeated attempts. Stop analysis increments the epoch and preserves saved checkpoints. No automatic whole-vault backfill is added.
- Prompt version is compact-evidence-prompt-v6; engine contextual-evidence-v5 and text pipeline markdown-passages-v5 are unchanged. Exact v5 source/model/settings fingerprints permit reuse of completed pending chunks and record mixed prompt provenance. Unchanged completed remote records stay stale until explicitly selected for reanalysis.
- Record identities, four score names, legacy date histories, prepared JSON/Markdown transactions, source-scope guards, consent, fixed GROQ_API_KEY lookup, independent chart populations and inert narrative rendering remain. Saved quotes are sensitive local data and may sync with the vault.

## Measurements and verification

Live synthetic Groq gpt-oss-120b regressions: final 18 cases repeated three times, 54 successful evaluations, all 57 required score constraints passed, zero unsupported scores, 56 requests and no HTTP 429. Median 1.27s versus 5.60s in the 18-case 1.4.1 reference (about 77% less time). Same synthetic 10-chunk worker batch: 65.03s to 4.92s (92.4% less wall time), 12 to 10 requests, peak concurrency one to five, no 429. Worker timings exclude native disk/DOM overhead; quota, provider load, source length and necessary repair affect real performance.

`docs/GROQ_PERFORMANCE.json`, `docs/GROQ_FAST_ACCURACY.json` and `docs/GROQ_PERFORMANCE_INITIAL.json` retain measurements and the initial compact trial's failures. The corpus was used for calibration and is explicitly a regression set, not held-out or clinical validation. Original measured full source/bundle hashes remain in reports. `scripts/groq-contract-hash.js` separately fingerprints the unchanged inference/quota/lifecycle/storage/worker code before buildRepairPreview plus its four modules, allowing the final dashboard copy correction from five calls to two without pretending another live run occurred.

Full functional/syntax, mock quota/concurrency/cancellation/recovery tests, responsive browser tests, privacy audit and diff checks passed before publication. CI repeats these gates. Regression tests cover five workers, quota reservations/RPD/Retry-After, global 429 surviving late successes, exact old fingerprint migration, opt-out cancellation, durable checkpoints and the original 68-chunk blocker.

## Publication and native state

1.4.1 was published from merge 14098ed08b9eccc63fe351376cea59a7649de25e (PR #6); source-bound asset attestations and digests verified and installed. Private backups preserve runtime/data/generated history and 198 source hashes. Current automatic/startup analysis preferences are both off and must stay as found; preserve chart toggles and every other current user setting. Native CLI works with current full access. A user-started 1.4.1 scan was canceled through the epoch guard; valid checkpoints remain. The private filesystem fallback made zero provider requests and must not run alongside Obsidian.

1.5.0 was published from merge 842795c31307ae5037208f4bf0d2d6e555bcd0c9; main CI 38958880407 and release 38958880592 passed. Release assets are published. The 1.5.1 candidate is on fix/output-recovery-diagnostics; see PROGRESS.md for current publication state. No claim that either private pending date has completed.

## Failed approaches and constraints

- Do not reinstate the heavy per-passage output lists, medium reasoning, five-call chunk loop or routine empty-result review. They consumed repeated instructions/output and caused avoidable latency.
- Do not assume Free-tier quota or solve throttling by uncontrolled parallelism. A synthetic session probe reported a much higher actual token limit; use response headers rather than hardcoded account assumptions.
- Do not discard valid evidence or completed chunks to hide pending work. Quotes cannot prove interpretation, diagnoses or clinical accuracy.
- Earlier continuity text described obsolete sandbox restrictions and historical settings; actual source, tests, current runtime state and latest user steering take precedence. Historical 1.4 behavior remains documented in Git history and its design/release notes.

## RESUME HERE

Finish 1.5.1 review/publication from the verified local candidate. `npm test`, browser layout, release audit and diff checks pass. The new live synthetic report covers 54 evaluations: 55/57 required scores passed, zero unsupported scores, one abstention each on second-person and temporal cases. Every constraint passed in at least two of three repeats; the model is nondeterministic. The 10-chunk worker run completed in 4.20s versus a reused 65.03s 1.4.1 baseline. Preserve the raw report in docs/GROQ_VALIDATION_1.5.1.json and disclose its two misses. Require green final-head CI; do not claim private dates are fixed until the user retries after installing. Provide PROGRESS.md and PROJECT_STATE.md. Do not run private journal analysis.
