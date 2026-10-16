# Automatic Mood History — durable project state

## Active objective: accountable coverage and contextual interpretation

Baseline: verified main 6f17fcc8c509428e4ed71c29540896909cbcfd53 (1.3.2). Prior release completion does not establish this objective. Single-agent execution only. User authorizes repeated Groq openai/gpt-oss-120b evaluations, live testing with the entire Obsidian vault within existing exclusions/consent/scope, and release publication after acceptance. No private text, paths, raw provider output, credentials or native screenshots enter Git.

## Architecture and decisions

- Obsidian CommonJS; scripts/build.js concatenates emotional-engine, sentiment-core, analysis-pipeline and main into tracked main.js. No production dependency.
- analysis-pipeline.js owns complete preparation, local passage/source mappings, deterministic splitting, opaque provider envelopes, v2 assessment validation, concept/pole aggregation and bounded display evidence selection.
- main.js keeps serialized scheduling, guarded provider calls, per-run character budget, durable chunk checkpoints, existing prepared JSON/Markdown transaction, independent dashboard populations and selectable repair preview.
- Four established nullable scores and schema-2 record identities remain. Evidence readers support v1 and v2. v2 explicitly assesses supported, unsupported, ambiguous, conflict or not_assessed independently of processing completion. Historical records show assessment coverage unknown.
- Pipeline markdown-passages-v5 / passage-coverage-v1; engine contextual-evidence-v5; prompt evidence-context-prompt-v5. Full source fingerprints include preparation and analysis settings. Remote historical results with matching legacy prefixes are stale, never automatically expanded on upgrade.
- Every provider call shares five attempts per chunk (formats, one completion recovery, one semantic review and bounded transport recovery). Repeated source/context characters consume the existing per-run character setting. Longer work remains queued and resumable; successful chunks reuse only identical complete fingerprints.
- Validate exact quote inside the identified passage. Unique exact quotes can repair model offset counting; repeated quotes need correct offsets. Textual basis supports intensity only. Local cues request one review but cannot veto contextual remote inference or explicit review abstention.
- Aggregate distinct concepts, opposing poles, temporal labels and basis independently of chunk count; retain polarity support separately from 16 displayed quotes. File ordering is never chronology. Local rules remain conservative English-only.

## Preserved constraints and discoveries

Existing source creation-date grouping, folder exclusions, unreadable-date blocking, legacy identities, fixed GROQ_API_KEY lookup, provider-only enabled mode, cancellation guards, inert rendering and prepared-write recovery remain. Saved source quotes intentionally live in local history/sync; excluding a source does not erase saved history. No automatic whole-vault backfill. Repair preview performs local reads and allows selected batches. Display-only repairs require no provider calls.

Confirmed baseline bugs: prefix hashing loses tail edits; nonempty intensity hides missing personal dimensions; unchanged remote reuse hides stale fingerprints; mood filtering removes independent axes; chart bridges missing data; nonempty evidence conflates interpretation and completion. See COVERAGE_BASELINE.md and frozen fixtures committed before tuning.

## Verification and current limitations

Full functional suite, new coverage/contract/recovery and exact-build frozen-evaluation gates, syntax/build, responsive layout (240–1440px/200% text), emotional benchmark (78 synthetic + 8 public excerpts), privacy audit, zero dependency advisories and diff checks pass. Three final live repeats with Groq 120b meet mood 27/27, connection 24/24 and all 57 required score constraints. Unsupported scores: 0/66 versus 5/66 on 1.3.2; final unresolved cases: zero. Requests fall 70→59; median latency rises 3.76→5.61 seconds. Input/output tokens rise 174,422/75,080→218,848/109,212. Reports preserve earlier completed trials and expose variability. Local rules remain conservative (mood 4/9, connection 2/8 on this separate corpus), without a parity claim.

Complete source accounting and provenance cost additional CPU and storage: see COVERAGE_PERFORMANCE.json. Large inputs previously truncated at 60,000 characters are not equivalent baseline work. Pending metadata is deleted after commit; compact mappings and bounded evidence remain sensitive local data. Exact quotation checks cannot prove semantic truth, universal recall, clinical accuracy or power-loss fsync guarantees. A long native historical replacement remains pending; its prior record and staged dimensions are preserved. Publication verification is the remaining release gate.

## RESUME HERE

Implementation and local acceptance are complete. Branch feat/accountable-emotional-coverage is being synchronized for 1.4.0. Finish latest-head GitHub CI, merge the reviewable PR, and verify the established release workflow, downloaded assets/digests and source-bound attestations. Then record exact publication evidence and deliver both continuity documents. Do not silently backfill unknown remote history, increase the saved data budget, or claim the pending native long date is complete. Session vault authorization is explicit here and must not be imported as authorization for an unrelated future session.

## Native verification and remaining history

The session explicitly authorized all-vault live testing, Groq 120b and publication. A local backup precedes installed changes. CLI preview inspected 24 creation-date groups/197 source files and made zero provider calls. Selected small (2,642 characters/3 files/1 chunk) and many-file (9,489 characters/11 files/3 chunks) groups committed all assessments and survived reload. All 197 original source hashes remain unchanged. Native evidence has zero active links/images/scripts/iframes and no dashboard overflow. The dots/connectivity regression is corrected: every available reading connects, with lighter labeled connectors across unscored dates. Native UI automation was stopped with Escape, and the user then explicitly authorized continued CLI verification.

A long native date (80 sources, 240,329 eligible characters, 68 chunks) remains visibly pending after invalid provider quotations. Valid staged axes and the prior record survive reload. Testing discovered and fixed format fallback inside semantic review, stale review target lists, and insufficiently specific quotation-bounds feedback. No full-vault backfill completion is claimed. Three pending groups remain locally; four records currently have complete v2 coverage. Original automatic/startup preferences (both on), Groq 120b and the 60,000-character budget are restored. Saved pending work will resume under the existing policy, and older unknown remote history remains stale until selected for repair.
