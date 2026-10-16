# 1.5.0 — Fast, quota-aware analysis

Replace the heavy chunk request with compact grounded output and low GPT-OSS reasoning. Normal successful chunks use one call; malformed or conflicting output gets at most one necessary repair. Exact source quotes, supported dimensions, prior records and crash-safe commits remain validated.

- Independent chunks run through a bounded worker pool. The first real response discovers quota, then available capacity permits three or five workers. Reserve estimated input/output tokens before dispatch; honor reported remaining tokens, reset times, daily request exhaustion and Retry-After. Manual resume never clears an active server quota pause.
- Remove repetitive per-passage output acknowledgments, offset counting, generated narrative fields and routine heuristic reviews. One explicit whole-chunk acknowledgment covers all supplied passages; quote offsets and readable explanations are derived locally. At most eight short evidence anchors preserve independent dimensions, contrasting feelings and time changes.
- Save one durable result checkpoint per chunk, serialize storage commits, throttle redraws and reconstruct redundant staging mappings from fingerprint-checked source.
- Resume pending drains productive character-limited batches immediately, without the artificial minute gap. The saved character cap applies to each batch; source scope/provider settings stay unchanged. Stop analysis preserves saved progress and cancels further dispatch.
- Existing validated pending chunks migrate only after exact old source/model/settings fingerprint verification. Mixed old/new prompt provenance is recorded.
- Dashboard telemetry reports request time, token use and token quota; bounded local metadata records reasoning tokens, request formats, status, concurrency and quota wait without source text or response bodies.

Measured synthetic 10-chunk batch: 1.4.1 65.03s → 1.5.0 4.92s (92.4% less wall time), concurrency 1 → 5, requests 12 → 10, no HTTP 429. Final small-entry median is 1.27s over 54 evaluations; the same 18-case 1.4.1 reference median is 5.60s. All 57 required score constraints pass with zero unsupported scores across three repetitions. These are engineering regressions, not held-out psychological validation; the initial compact trial and its failures are retained in GROQ_PERFORMANCE_INITIAL.json.

See GROQ_PERFORMANCE.json and GROQ_FAST_ACCURACY.json for exact source fingerprints, measurements and limits. Latency varies with quota, provider load, text and necessary repair; parallelism cannot exceed the account's actual quota.
