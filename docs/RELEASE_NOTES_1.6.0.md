# Automatic Mood History 1.6.0 — Desktop, Android and iPhone

Your notes. Your emotional timeline. This release brings Automatic Mood History to Obsidian on Android and iPhone, with offline analysis, touch-friendly dashboards and mobile Groq setup.

## What's new

- Enable the same plugin on desktop, Android and iOS; the bundled runtime works without Node.js APIs.
- Save a Groq API key from a masked field through Obsidian secret storage (requires Obsidian 1.11.4+). Desktop `GROQ_API_KEY` still takes precedence. Keys stay outside plugin data and generated notes; Obsidian manages the secret store.
- Recover opted-in automatic work when the app returns to the foreground or connectivity returns, with existing consent and retry limits. Automatic analysis pauses while the mobile app is hidden.
- Treat network loss as a connection failure, preserving pending work without unnecessary output-format retries.
- Provide 44px touch targets, phone-friendly inputs, portrait/landscape layouts, a new README banner and a clearer installation guide.
- Preserve existing history, source filters, Groq opt-in and automatic-analysis preferences. Saving a key never enables Groq or sends notes.

## Install or update

Use [BRAT](https://github.com/TfTHacker/obsidian42-brat) on desktop or mobile with repository URL `https://github.com/remriel/automatic-mood-history`, or copy `main.js`, `manifest.json` and `styles.css` from this release to `.obsidian/plugins/automatic-mood-history/` in your vault. Restart Obsidian and enable the plugin. You can also sync an existing desktop plugin installation using your vault's supported plugin-sync settings.

Local analysis needs no API key. For Groq on phones, update Obsidian to 1.11.4+, open **Settings → Automatic Mood History → Groq API key**, tap **Save key**, enable Groq analysis and choose **Check Groq**. Configure each device where needed.

The optional `moodring-model.bin` belongs beside the three plugin files. Existing 1.5.5 model files remain compatible; the model format and scoring have not changed.

## Verification and limits

The release checks include the full regression suite, a mobile-like runtime without `process` or `Buffer`, secret-storage and lifecycle tests, desktop responsive tests, and touch/layout tests in Android Chromium and iPhone WebKit emulation at 320–844px. The artwork uses illustrative trends.

Physical Android/iPhone installation, OS suspension, actual device secret storage and a live Groq account have not been tested in this environment. Android and iOS can suspend Obsidian; continuous analysis while the app is closed is not provided. File creation timestamps depend on the device and sync provider.
