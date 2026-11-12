# Wisdom — trend chart release

## 2026-11-11 — 1.7.3 range-aware summaries

Evidence: the user explicitly asked that average tiles reflect the selected range and requested publication. The Days scored tile was also updated so the count matches the averaging period; history remains full. Version 1.7.3 and CI/release checks succeeded. On final check, the installed plugin was already 1.7.3; the manifest and stylesheet matched the release and the bundle retained only its existing trailing `/* nosourcemap */` comment. No vault files were changed by this task.

1. **Least confident:** native Obsidian rendering because the app was stopped during file verification. I would inspect the dashboard on launch if the user reports a display issue.
2. **Easiest to miss:** narrow ranges can have missing scores for a metric; the tile should show an em dash when no scores exist for that metric. I would keep this state covered by tests.
3. **Highest-impact assumption:** Days scored should match the chosen averaging range. If the user expected that count to remain full history, I would separate its label and behavior.

## 2026-11-11 — 1.7.2 trend-window release

Evidence: The user requested 7-, 14-, and 60-day trend windows, a 14-day default, and publication. The existing inclusive latest-scored-date and chart-only behavior was retained. Version 1.7.2 is published; PR CI, main CI, and the release workflow passed.

1. **Least confident:** native Obsidian and physical-phone rendering, since the checks used synthetic browser fixtures. I would verify the dashboard on those devices if issues are reported.
2. **Easiest to miss:** the range filters only the chart, and it ends at the latest scored day, which may not be today. I would change that behavior if a calendar-today window or filtered history is preferred.
3. **Highest-impact assumption:** preserving the existing inclusive, latest-scored-day interpretation is desired. If not, I would adjust the boundary and update the tests and documentation.

## 2026-11-10 — solid-line chart update

1. **Least confident:** native Obsidian and physical-phone rendering; a synthetic browser preview and CI emulation cannot fully reproduce them. Next, inspect the released plugin in a separate test vault on real devices.
2. **Most easily missed:** lines join observations across calendar gaps and do not represent known values on intervening days. Explicitly missing scores break a line, and the chart explains the distinction. Revisit gap presentation if it still suggests continuous measurement.
3. **Highest-impact assumption:** the user wants the existing separate metric plots improved rather than combined into one overlapping chart. Separate plots protect readability and make the solid lines distinguishable; offer a combined comparison mode if that assumption is wrong.

## 2026-11-04

1. **Least confident:** how the chart feels in a real Obsidian vault on physical phones. Browser emulation covers layout and interaction but does not replace native testing. Next, try a range of real history sizes on devices.
2. **Most easily missed:** connecting recorded scores across gaps can look like a continuous measurement. The chart explicitly says the line joins observations and does not estimate missing days. A future design could make gaps even more visually prominent after user feedback.
3. **Highest-impact assumption:** a 30/90/365-day window should end at the most recent scored date rather than today. This keeps older histories explorable; if users expect calendar-to-today windows, offer that choice and a clear empty state.
