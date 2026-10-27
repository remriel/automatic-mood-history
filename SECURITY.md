# Security policy

## Reporting a vulnerability

Open a GitHub security advisory for this repository when possible. Do not attach real vault files, journal text, plugin `data.json`, API keys, environment dumps, screenshots of private notes, or generated mood entries to public issues.

Include a minimal synthetic reproduction and the plugin version.

## API keys

Automatic Mood History reads only `GROQ_API_KEY` from the Obsidian process environment, with fallback to the fixed `automatic-mood-history-groq` ID in Obsidian's native secret storage (Obsidian 1.11.4+). The masked settings field saves only through that API. Keys are never included in plugin data, generated notes or intentional logs. Synced plugin settings cannot select arbitrary environment variables or unrelated secrets. Environment keys take precedence on desktop. The plugin does not implement its own secret-store encryption.

If a key may have been exposed, revoke it through the provider and create a replacement.
