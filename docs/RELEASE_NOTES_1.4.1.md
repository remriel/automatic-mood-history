# 1.4.1 — Pending analysis recovery

Fix stalled date groups caused by failed-chunk blocking and escalating continuation delays.

- A failed evidence/format assessment keeps its checkpoint and cooldown while independent later chunks continue within the existing per-run character cap.
- A cooling chunk is skipped rather than blocking the rest of its date. Ready smaller chunks can use the remaining budget.
- Normal budget continuation schedules the next pass after one minute without exponential failure backoff. Failure counters belong to individual chunks; newly resolved dimensions reset their failure penalty.
- Date retry scheduling retains the earliest outstanding chunk deadline and the actual failure category. Provider-wide pauses still stop requests and respect rate-limit guidance.
- Add **Resume pending** to the dashboard and command palette. One immediate budget-limited pass targets only unfinished work and reuses validated chunks; automatic analysis continues later passes if enabled.
- Refresh progress after persisted checkpoints and display retry/continuation times. A failed save after a validated response remains a storage retry, without a provider cooldown.

Source preparation, evidence validation, prompt/model fingerprints, provider opt-in and source scope remain compatible with 1.4.0 checkpoints. Historical results stay visible until a complete replacement commits.

Verification includes a previously failing scheduling reproduction, a full 68-chunk synthetic date through real request parsing/validation, automatic recovery and reload, per-pass character caps, targeted correction, checkpoint failures, rate limits and cancellation. No private-vault completion or live-provider assessment is implied by synthetic verification.
