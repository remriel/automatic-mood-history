# Wisdom

1. **Least confident:** Safe migration of existing creation-date summaries. I would implement and test an explicit reversible migration before installation.
2. **Biggest missing consideration:** Changing date detection changes historical grouping, and old summaries can remain visible or be recalculated from only some original notes. I would preserve historical records and make their status clear.
3. **Most consequential assumption:** That dates are expressed in filenames and the Morning Pages preset list is the intended definition of automatic detection. If dates also appear in note contents or other formats, I would extend detection with explicit ambiguity handling and tests.
`nPublication update: Published a testing prerelease only. Least confidence remains historical migration; the hidden issue is stale old groups; the key assumption remains filename-based dates. Address these before stable promotion.


Stable update:
1. Least confidence: native Obsidian behavior on the user's vault. User will test it; I would use the release and Analyze changed to inspect grouping.
2. Biggest consideration: historical scores cannot be split between dates accurately. Preserve them separately and analyze actual source text for new groups.
3. Key assumption: date detection means filename dates using Morning Pages conventions. If content dates are intended, add explicit precedence and ambiguity rules.


Release completion: stable 1.7.4 is published and verified. Least confidence remains native behavior on the user vault; user will test. The important hidden constraint is that old aggregate scores cannot be redistributed accurately; preserve and reanalyze. Filename dates remain the key assumption; content-date parsing would require separate precedence rules.


Custom ranges:
1. Least confident: native mobile date pickers; user will test. I would inspect actual Android/iPhone input behavior.
2. Biggest consideration: an empty custom interval must update summaries and clear chart selection coherently. This is handled explicitly.
3. Key assumption: Custom means inclusive start/end dates and temporary selection, consistent with existing preset behavior. Persistent selection would require a separate saved preference.

Custom-range release completion: 1.7.5 stable/latest is published and verified. Native date picker behavior remains the least certain aspect; user testing covers it. Empty ranges require coordinated chart/summary reset, implemented and checked. The key assumption is inclusive, transient custom ranges consistent with presets.
