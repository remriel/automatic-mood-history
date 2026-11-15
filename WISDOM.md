## 2026-11-15 — reliability release

1. Least confident: native Obsidian/device and live-provider behavior. I would verify these in an isolated test vault before claiming native coverage.
2. Biggest gap: a passing audit cannot prove the absence of every bug. I would keep regression tests and investigate new reproducible reports.
3. Largest assumption: publish means GitHub plugin releases, with unchanged saved scores preserved on provider failure. If a different distribution or overwrite policy is intended, I would adjust that explicitly.

# Wisdom

## 2026-11-15 — monthly-history recovery release

1. **Least confident:** Synthetic generated notes passed the recovery checks, but real synced vault files and native Obsidian storage behavior were not tested. I would verify with copied monthly exports in an isolated vault before claiming real-vault coverage.
2. **Biggest thing the user may be missing:** Deleting `data.json` does not fully reset history while valid monthly recovery blocks remain in the configured output folder; the next startup can restore them. Move those exports elsewhere first when a clean reset is intended.
3. **Most consequential assumption:** Existing JSON records should win for the same date and date basis, while valid monthly records may fill missing identities. If the desired policy is to replace or merge same-identity records, the recovery rules need to change.

## 2026-11-14 — release reliability fixes in progress

1. **Least confident:** Runtime checks are still underway, so the exact behavior across all analyzer sources and settings transitions is not verified yet. I would wait for the full regression results before describing these recovery paths as complete.
2. **Biggest thing the user may be missing:** Synthetic tests can show score preservation and threshold reevaluation in the harness, but they do not establish live Groq/provider behavior or native Obsidian behavior. I would keep those limits explicit until separately checked.
3. **Most consequential assumption:** A failed Groq retry should preserve any unchanged complete score, regardless of analyzer source. If that preservation policy differs by analyzer, the retry fix would need a narrower rule; I would verify that policy against the intended product behavior before changing it.

## 2026-11-14 — Morning Pages fallback and dashboard updates

1. **Least confident:** Whether English word counts give useful scores for the user's own writing. Synthetic cases prove the mappings and edge behavior, not personal accuracy. I would keep the fallback visibly low confidence and ask for feedback on representative writing before changing the scoring rules.
2. **Biggest thing the user may be missing:** The fallback only uses the companion plugin's built-in word lists; it does not receive custom lists and cannot understand negation, quotation, or who is feeling what. I would explain that distinction wherever fallback results appear and preserve unchanged provider and older local results rather than silently replacing them.
3. **Most consequential assumption:** “Grok” meant the existing Groq provider. If the user meant xAI Grok, this release does not meet that request; I would clarify the intended service and its consent/settings path before adding another provider.

## 2026-11-14 — streamline the dashboard

1. Least confident: the live Obsidian theme and its custom overrides; inspect only if requested.
2. Easy to miss: moving averages and summary-card averages are different features. Remove the former and preserve the latter.
3. Most consequential assumption: matching button size means matching height, typography and padding while allowing widths to fit labels. Keep readable text and 44px touch targets.

## 2026-11-14 — smaller summary cards

1. Least confident: appearance in the user's native theme; verify only if requested.
2. Biggest consideration: labels must remain readable when cards shrink; check narrow and enlarged-text layouts.
3. Main assumption: smaller means reducing card width and height, not the recorded values; preserve all calculations.

## 2026-11-14 — composition and monthly history

1. Least confident: the installed plugin's appearance in the user's live theme; inspect only when requested.
2. Easy to miss: the fixed top ten uses all saved scored history, including older records, while bars show the selected range and exclude other labels from their denominator.
3. Most consequential assumption: a saved daily output choice should remain in force when the default changes. Preserve existing choices and let the user select monthly explicitly if needed.

## 2026-11-13 — settings proportions and write safety

1. Least confident: native Obsidian and third-party theme layouts remain unverified. Test the published release in the user's theme when native testing is authorized.
2. Easy to miss: a note can be edited before an export starts, not only during an interrupted write. Compare the whole note with known generated content and preserve conflicts.
3. Most consequential assumption: filename dates and current saved records faithfully describe their original notes. Skip ambiguous dates, keep original entries and backups, and reanalyze instead of copying a mixed score to new dates.

## 2026-11-13 — compact history and import dates

1. Least confident: native runtime and multi-device sync behavior are not established by synthetic tests. Verify the installed app and keep both visible monthly exports and plugin-data backups.
2. Easy to miss: daily notes may contain orphaned history absent from current JSON. Compare the full inventory and preserve those originals before reducing file counts.
3. Most consequential assumption: filename dates represent the intended writing dates. Recognize only supported complete tokens, make numeric ambiguity explicit, and skip conflicting dates rather than inventing a date or copying a mixed score.

---

# Publication reflection — 2026-11-13

1. Least confident: how the emotion palette will feel in the user's actual Obsidian theme; I would review it in the running app and adjust based on feedback.
2. Biggest missing consideration: a restart or plugin reload is needed before the installed files take effect; mobile devices may need to receive the update separately. I would verify the dashboard on each device used.
3. Most consequential assumption: one fifth of the selected calendar span is the desired smoothing rule. If it feels too smooth or too noisy, I would tune the ratio or make it configurable.

---

# Reflection — 2026-11-13

1. Least confident: whether one fifth of the range provides the preferred smoothing; tune the ratio based on use.
2. Emotion colors are now stable but their emotional associations are subjective; adjust the palette with user feedback.
3. Assumed selected calendar span should determine smoothing, including custom and all-history ranges; change the rule if a different relationship is preferred.

---

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


1.7.6: Least confidence is native visual behavior; user will test. Biggest consideration is denominator: composition is the share of recorded emotion labels within each period, not intensity or probability of a feeling. Key assumption is that Morning Pages-like stacked percentages with adaptive calendar periods meet the requested composition chart; I would add manual grain selection if needed later.

1.7.6 completion: Published stable/latest and verified. Least confidence: native chart behavior, to be checked by user. Biggest consideration: label share and emotion intensity are different; chart explains its denominator and offers exact counts. Key assumption: adaptive calendar periods with stacked percentages satisfy the Morning Pages composition request; manual period selection can be added if desired.


Top-seven update:
1. Least confidence: the chart?s appearance in the user?s native Obsidian environment. User testing remains the best next check.
2. Biggest consideration: percentages now describe only the displayed top seven, so a period containing solely excluded labels is blank; the chart explains that denominator.
3. Main assumption: ?or top 7? selects seven rather than ten. If ten was intended, change the ranking limit and provide three additional distinct colors.


1.7.7 combined update:
1. Least confidence: native phone/Obsidian rendering of the dashed averages and date controls; user will test. I would check a sparse week and an active custom range on device.
2. Biggest consideration: a moving average needs a defined time window and missing-data policy. This uses seven calendar days, at least two available scores, and only the chosen range; a lone score is not plotted as an average.
3. Most consequential assumption: the user prefers the suggested top seven and a seven-day average. If a different rolling window is desired, I would add a configurable window.

1.7.7 release: Stable is published and verified. Least confidence remains native Obsidian display. The key consideration is that percentages use displayed top-seven labels and averages need at least two scores in seven calendar days. The key assumption is that the requested moving window is seven days; add an adjustable window if the user wants a different one.
