# Wisdom

1. **Least confident:** Safe migration of existing creation-date summaries. I would implement and test an explicit reversible migration before installation.
2. **Biggest missing consideration:** Changing date detection changes historical grouping, and old summaries can remain visible or be recalculated from only some original notes. I would preserve historical records and make their status clear.
3. **Most consequential assumption:** That dates are expressed in filenames and the Morning Pages preset list is the intended definition of automatic detection. If dates also appear in note contents or other formats, I would extend detection with explicit ambiguity handling and tests.
`nPublication update: Published a testing prerelease only. Least confidence remains historical migration; the hidden issue is stale old groups; the key assumption remains filename-based dates. Address these before stable promotion.
