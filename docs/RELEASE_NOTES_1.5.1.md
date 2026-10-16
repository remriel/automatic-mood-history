# 1.5.1 — Output recovery and diagnostics

This update addresses partial date assessments where one Groq chunk remains pending after the other chunks complete.

- Repair a unique quotation when the provider changed only whitespace or curly/straight quotation marks. The saved quote is copied from the exact source span. Ambiguous or altered wording remains unresolved.
- Keep quotation offsets correct after trimming surrounding spaces and recheck that a supported score still has a valid source quote after normalization.
- Classify invalid response bodies as output errors rather than global connection failures. The dashboard now shows safe validation codes for pending output chunks so the next retry is easier to diagnose. Existing completed chunks and saved records remain intact.
- Limit three-worker dispatch to accounts with at least three reported daily requests remaining, and make passage preparation linear in chunk count.

The retry still uses at most two provider calls per chunk per attempt and honors the saved source-character cap and quota pauses. A failed quote or unresolved semantic claim remains pending instead of receiving an invented score. The exact reason for a previously failed private chunk cannot be reconstructed from the dashboard line alone; after updating, its safe diagnostic code is visible in Processing Status.
