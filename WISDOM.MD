# Wisdom — trend chart release

## 2026-11-10 — solid-line chart update

1. **Least confident:** native Obsidian and physical-phone rendering; a synthetic browser preview and CI emulation cannot fully reproduce them. Next, inspect the released plugin in a separate test vault on real devices.
2. **Most easily missed:** lines join observations across calendar gaps and do not represent known values on intervening days. Explicitly missing scores break a line, and the chart explains the distinction. Revisit gap presentation if it still suggests continuous measurement.
3. **Highest-impact assumption:** the user wants the existing separate metric plots improved rather than combined into one overlapping chart. Separate plots protect readability and make the solid lines distinguishable; offer a combined comparison mode if that assumption is wrong.

## 2026-11-04

1. **Least confident:** how the chart feels in a real Obsidian vault on physical phones. Browser emulation covers layout and interaction but does not replace native testing. Next, try a range of real history sizes on devices.
2. **Most easily missed:** connecting recorded scores across gaps can look like a continuous measurement. The chart explicitly says the line joins observations and does not estimate missing days. A future design could make gaps even more visually prominent after user feedback.
3. **Highest-impact assumption:** a 30/90/365-day window should end at the most recent scored date rather than today. This keeps older histories explorable; if users expect calendar-to-today windows, offer that choice and a clear empty state.
