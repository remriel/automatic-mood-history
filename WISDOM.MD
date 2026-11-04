# Wisdom — trend chart release

## 2026-11-04

1. **Least confident:** how the chart feels in a real Obsidian vault on physical phones. Browser emulation covers layout and interaction but does not replace native testing. Next, try a range of real history sizes on devices.
2. **Most easily missed:** connecting recorded scores across gaps can look like a continuous measurement. The chart explicitly says the line joins observations and does not estimate missing days. A future design could make gaps even more visually prominent after user feedback.
3. **Highest-impact assumption:** a 30/90/365-day window should end at the most recent scored date rather than today. This keeps older histories explorable; if users expect calendar-to-today windows, offer that choice and a clear empty state.
