# No-horizontal-scroll QA inventory

## Acceptance and intended claims

- Dashboard needs vertical scrolling only; no horizontally scrollable or clipped region.
- Layout follows the note pane, including a narrow pane within a wide Obsidian window.
- Trend retains every scored timestamp-group point and legible axes; tick density changes with pane width.
- Daily history retains all records, score fields, summaries, emotions, analyzer/date-basis labels, and conflict-safe entry links.
- Empty and insufficient-evidence states do not invent scores.
- Existing history and user analysis preferences survive installation.

## Functional and visual coverage

- Light/dark at 240, 280, 320, 360, 390, 480, 620, 760, 1024, and 1440px pane widths.
- Root/descendant scrollWidth/clientWidth, bounds, no hidden-overflow clipping, and actual scrollLeft attempts.
- Narrow panes in a 1600px window; 200% text; long unbroken summaries, model names, and labels.
- Empty, one-day, insufficient-only, mixed legacy/timestamp, and dense 365-day histories.
- Analyze changed, Retry Groq, Check Groq: normal clicks, busy/disabled states, returned status (fictional fixture, no remote calls).
- Entry links including conflict-safe paths; settings toggle and model input.
- ResizeObserver cleanup; exact owned-dashboard Base-embed migration, idempotence, unrelated/concurrent writing protection.
- Installed native Obsidian dashboard: current theme, narrow pane, resizing, overflow metrics, and screenshots.

## Evidence boundaries

- Browser fixture runs the actual bundle/CSS with a minimal Obsidian DOM adapter and fictional records, not the full native app.
- Layout verification must never trigger analysis of private notes.
- Native screenshots and vault data stay local, never committed/published.
- Optional native Base tables are a separate Obsidian view; linked, never embedded in the default dashboard.
