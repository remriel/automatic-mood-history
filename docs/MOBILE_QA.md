# Mobile verification for 1.6.0

## Automated evidence

- `npm run test:mobile`: the actual bundled plugin loads with only Obsidian imported and no `process`, `Buffer` or Node filesystem APIs. Local analysis writes an entry through the vault API. Tests cover secret save/clear/failure, desktop key precedence, fixed secret names, cancellation after key rotation, fictional Groq requests and connection backoff.
- Resume tests cover coalesced visibility/focus/online events, mobile background guards, automatic-analysis opt-out, provider pauses and cleanup on unload.
- `npm run test:mobile-layout`: actual bundle/CSS in Pixel 7 Chromium and iPhone 13 WebKit emulation. Portrait/landscape widths 320, 360, 390, 430 and 844px; light/dark themes; empty, one-day, insufficient and 365-day histories; no horizontal overflow; 44px action, legend and entry-link targets; touch interactions; masked key save/clear; settings at 200% text.
- `npm run test:layout`: existing desktop/narrow-pane layout checks remain in place.
- Both CI and the release workflow run the mobile suites. All fixtures are synthetic; no personal notes, API keys or live provider calls are used.

## Physical-device follow-up

These checks are browser emulation and API mocks, not native Obsidian device evidence. On real Android and iPhone, verify BRAT installation/update, command-palette access, key persistence after restart, vault sync, optional model loading, foreground recovery after OS suspension, and existing-history preservation. Continuous operation while Obsidian is closed cannot be guaranteed by a mobile plugin.
