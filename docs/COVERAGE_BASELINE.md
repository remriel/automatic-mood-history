# Coverage baseline — 2026-10-15

Verified main: `6f17fcc8c509428e4ed71c29540896909cbcfd53`, GitHub CI 38804780810 succeeded. Clean fresh clone; no private sources inspected. Node 24.19.0; npm ci reports zero advisories. The full existing functional suite passes.

Before implementation, `node tests/coverage-reproductions.test.js --baseline` reproduced all four failures: final-passage-only edits have identical hashes after the 100-character cutoff; intensity-only output makes one request and hides missing personal dimensions; changed remote model preserves the result without exposing staleness; no independent dashboard population selector exists. Source inspection additionally confirms that the chart bridges null axes and nonempty evidence alone sets complete.

Separate development and frozen evaluation corpora were committed before implementation. Synthetic cases are engineering labels with broad acceptable ranges, not psychological ground truth. The frozen set includes indirect expression, reciprocity, mixed states, depletion/agitation, negation, attribution, sarcasm, neutral text, short entries, multilingual writing, temporal changes and embedded instructions. No private text or provider response is committed. Provider evaluation is explicitly authorized for synthetic text only using Groq openai/gpt-oss-120b; saved user model settings remain intact.
