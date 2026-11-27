# 2026-11-27 — Automatic Mood History 2.2.1

1. I’m least confident about how consistently Groq distinguishes adjacent scores on real writing. I’d compare repeated scores on a small set of representative samples.
2. Older entries still have five levels of detail on the new chart. I’d use newly analyzed entries when comparing fine differences.
3. I treated “default” as a preference for new setups. If you meant to change your existing vault, I’d switch that vault’s Analysis scope directly.

# 2026-11-27 — Automatic Mood History 2.2.0

1. **Least confident:** How consistently Groq distinguishes adjacent scores on real writing. I’d compare repeated scores on a small set of representative samples.
2. **Biggest thing to watch:** Older entries still have five levels of detail, even on the new chart. Use newly analyzed entries when comparing fine differences.
3. **Most consequential assumption:** Existing assessments should carry forward. If you want finer scores for past entries, I’d reanalyze a selected date range deliberately.

# 2026-11-27 — Automatic Mood History 2.1.4

1. **Least confident:** How visible the scope selector is in custom Obsidian themes. I’d check the dropdown and active editor on desktop and mobile in native Obsidian.
2. **Biggest thing to watch:** A parent include covers its subfolders. If one child should stay private, list the intended subfolders individually or choose scan-all mode with explicit exclusions.
3. **Most consequential assumption:** Upgrades should require fresh opt-in to whole-vault scanning. If existing whole-vault choices should carry forward, I’d migrate only settings that recorded explicit vault-wide consent.

# 2026-11-26 — Automatic Mood History 2.1.3

1. Least confident about the button in a custom native Obsidian theme. I would check the installed plugin with the active theme.
2. Automatic Mood History has a single, long Settings pane. The footer follows the last action. I would check by scrolling to the bottom in a narrow native pane.
3. I assumed both plugins should use the same creator page. If they need different recipients, I would change only the Automatic Mood History link.

# 2026-11-19 — 1.9.10 composition chart

1. **Least confident:** How easily closely related colors can be distinguished in the user's Obsidian theme. I would check the busiest range in that theme, including how readable the period details are.
2. **Biggest missing point:** A period can change appearance when the selected range changes because percentages use the emotions displayed in that range. For comparisons across ranges, I would check the counts in Period details alongside the percentages.
3. **Most consequential assumption:** The user meant that the legend should change with the selected dates. If they wanted every emotion within a range to remain accessible even when it falls outside the top ten, I would add a way to reveal those additional labels.

---

# 2026-11-17 — 1.9.5 published

Release workflows 44156399770 and 44156401933 passed; all three asset digests and normalized plugin asset parity were verified. Native Obsidian behavior and personal-vault performance remain the user's follow-up.

1. **Least confident:** How much faster the dashboard feels in the user's actual vault and Obsidian theme. The candidate changes are prepared, but native CPU and interaction behavior has not been measured. I would check a large history after installation and watch for slow expansion or missing entry details.
2. **Biggest missing point:** Deferring day cards and caching filename parsing only target dashboard rendering and date grouping. Other plugins, vault sync, or analysis providers may still dominate perceived lag. I would compare the user's reported slow action with the new version before attributing all improvement to these changes.
3. **Most consequential assumption:** The cache key covers every setting that changes filename-date parsing: filename, Daily Notes format, numeric date order, and Moment locale. If parsing also depends on another mutable setting, include it in the key or explicitly invalidate the cache.

---

# 2026-11-16 ? composition spacing

1. Least confident: actual appearance in the user?s Obsidian theme; verify with a native visual check if needed.
2. Spacing changes only the display; existing mood scores and history are unchanged.
3. Assumption: the 180-day proportional width rule is the desired reference across daily and custom ranges; adjust the ratio if the gaps should differ.

---

## 2026-11-15 — 1.9.3 published

1. **Least confident:** CI and downloaded asset hashes passed, but native Obsidian installation and live recovery remain unchecked. I would verify them after the user updates the plugin, preserving the edited November export.
2. **Biggest missing point:** Morning Pages is the offline fallback; Moodring was an independent optional comparison. Removing it does not rerun or replace saved primary scores.
3. **Most consequential assumption:** Plugin JSON remains authoritative while edited monthly notes are protected exports. If edits in monthly notes should override JSON scores, that needs an explicit import flow.

## 2026-11-15 — fallback simplification and chart ranges

1. **Least confident:** The new range preference and full-width bars are verified in fixtures, but their appearance in the user's native theme is not yet checked. I would inspect them in a copied vault after installation.
2. **Biggest missing point:** Morning Pages fallback was already active; Moodring was a separate optional sidecar. I removed the sidecar feature without changing the saved primary scores or reanalyzing notes.
3. **Most consequential assumption:** "Both plugins" means Automatic Mood History and Morning Pages Analytics, and Last used should include custom dates. If another plugin or a different range policy was intended, I would adjust the setting and persistence behavior.

## 2026-11-15 — recovery backlog and Obsidian lag

1. **Least confident:** Native Obsidian behavior after installing 1.9.3 is unverified. I would test the update in a copied vault, then check the live backlog only after backing up its data file.
2. **Biggest missing point:** The 927 queued items are already computed results waiting for storage recovery; most were not requests for fresh AI analysis. I would publish the saved results in batches and keep the edited November export visible as a separate conflict.
3. **Most consequential assumption:** `data.json` remains the authoritative score store, while edited monthly Markdown is a protected export. If the user instead wants edits inside the monthly note to override JSON, I would design an explicit import and conflict resolution flow before changing any scores.

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

Source audit reflections, 2026-11-17: (1) Undated notes rely on creation timestamps, which can reflect import day. Inspect a specific note if its date seems wrong. (2) Each detected day can reference multiple source notes. (3) Coverage assumes the configured folder exclusions are intentional. Recheck scope if the desired source set changes.

1.9.6 reflections: Device-specific rendering remains the least certain. Dashboard navigation cost depends on history size. The release prioritizes repeated interactions and preserves source attribution.

## 1.9.8 audit

Confidence is lowest in native mobile behavior. A full-suite pass covers modeled cases. The audit assumes supported vault data follows the documented schema. A device smoke test would reduce uncertainty.

1. Confidence is lowest in native mobile behavior. Repeat the affected flow in Obsidian on a physical device.
2. Publishing does not establish which build a running Obsidian instance has loaded. Check the installed version when diagnosing a recurring symptom.
3. The audit assumes the official repository matches the plugin in use. If it is a fork or local edit, compare its installed bundle with the release asset.

2026-11-19. Least confidence: native display after reload; verify on-device. Hidden factor: sync can change source membership while saved dates survive. Assumption: users want dated snapshots even after source changes; refresh analysis when a current-source score is required.

1.9.9. Least certain: broader provider wording; retain strict scored validation. Hidden issue: storage conflicts can mask a successful provider result. Assumption: explicit no-evidence narratives should yield insufficient status; keep separate from scored days.

## 1.9.11 metric grid

1. Least confidence: text fit in native Obsidian with custom fonts or zoom. Check a narrow native pane first.
2. Easy to miss: five fixed tracks leave less space for labels on phones. Check the longest label at your usual zoom.
3. Main assumption: all five columns should remain in one row on mobile. If mobile readability takes priority, use fewer tracks at a narrow breakpoint.

## 1.9.12 recorded-day explorer

1. Least confidence: fidelity to the missing reference image. Compare the panel with the source image when available.
2. Easy to miss: the picker is scoped to the active chart range. To see an older date, widen the range.
3. Main assumption: the existing keyboard slider should remain alongside the dropdown. If the reference omits it, review whether the extra control is still wanted.

## 1.9.13 recorded-day reference

1. Least confidence is native Obsidian rendering across themes and devices. Verify the panel in the installed application.
2. The date selector includes only dates in the current trend window. Widen the window to select older dates.
3. The design assumes the reference is the authority for the yellow date card and selector prompt. Compare it in the intended pane size.

## 2.0.0 — summary-card release

1. Least confident: how the user's particular Obsidian theme, font, and zoom render the cards; browser fixtures passed, but native Obsidian was not tested. Check the installed plugin at the usual desktop settings.
2. Biggest consideration: publishing a release does not necessarily update an installed copy. Update through BRAT or copy the three release files, then reload Obsidian.
3. Key assumption: the cramped plugin layout caused the reported clipping. If the text still clips after updating, inspect the actual theme and font overrides in the native app and adjust accordingly.

## 2.1.0 selected-day release

1. Least confident: whether the smaller cards look right in the user's native theme and preferred pane size. Compare at their normal desktop zoom after updating.
2. Biggest consideration: the panel shows emotions already saved for the selected day; choosing a date does not rerun analysis. Days without saved emotions show an explicit empty message.
3. Key assumption: the requested 30% reduction refers to a wide desktop pane; narrower panes and larger text may reflow to keep labels readable. Adjust if the user wants different sizing.
4. Linux CI exposed a label break that did not occur with the local Windows font. Leave extra room around the widest labels and verify the compact layout on both platforms before release.
## Monthly exports, November 26
1. The cause of an individual file mismatch needs a comparison with a known generated copy.
2. Saved records can be newer than exported Markdown. Check both before rerunning analysis.
3. Automatic analysis is opt-in and may use the configured provider. Confirm provider preferences before enabling it.

## 2.1.2 release verification, November 26
1. Release workflow assets can be checked directly against the Git tag blobs and GitHub-provided SHA-256 digests. Verify provenance against the exact source ref, merge commit and release workflow.
2. GitHub CI emits Node.js 20 deprecation annotations for existing actions even though the workflows pass.

## Publication follow-up, November 26
1. Least confidence: Native Obsidian settings rendering and notice behavior were not smoke-tested. Verify these in the installed app if the user reports that the revised explanation still feels unclear.
2. Biggest missing consideration: Export months writes saved analyzed records; future records still depend on running analysis, either manually or through the opt-in automatic setting.
3. Main assumption: Publishing the open fix as the next patch release (2.1.2) was intended. If the user meant republishing 2.1.1 without the fix, that would have produced a different result.
