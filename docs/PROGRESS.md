# Project Progress

## Current objective

Release Automatic Mood History 1.2.5 with intensity plotted alongside mood, energy, and connection.

**Progress: 100% — implemented, verified, and published.**

- [x] Reconcile repository and published 1.2.4 source.
- [x] Plot saved intensity scores on the common 1–5 scale.
- [x] Add distinct light/dark color, dash-dot pattern, legend, tooltips, and accessible description.
- [x] Verify exact plotted intensity and omission of missing values.
- [x] Pass npm test, npm run audit:release, and npm run test:layout.
- [x] Update version metadata, changelog, and version-specific release notes.
- [x] Push source to main, confirm CI, and publish tag 1.2.5.
- [x] Verify release notes, three assets, published hashes, and signer-workflow attestations.

## Current implementation state

Published: https://github.com/remriel/automatic-mood-history/releases/tag/1.2.5

Tag/source commit: a2eb6b39a87c6016a5455a385643acd037acc303.

Intensity reads existing intensityScore values. The build import matcher accepts Windows CRLF and Unix LF line endings. Groq-only analysis and legacy-date recovery remain included.

## Verification

Main CI 37657910548 and Release workflow 37658046595 passed. All three downloaded release assets passed gh attestation verify with .github/workflows/release.yml enforced as the signer. Published asset SHA-256 values match the downloads.

Core, startup, timestamp grouping, Groq recovery, legacy recovery, and dashboard migration tests passed. Layout checks cover light/dark 240–1440px panes, 200% zoom, dense history, missing intensity, exact score coordinates, distinct trace patterns, legends, accessibility, interactions, and observer cleanup. The privacy audit found no sensitive files or private artifacts.

## Blockers

None.

## Exact next steps

1. No required work remains for release 1.2.5.
2. Future local installs must preserve saved data and any private archive features.
