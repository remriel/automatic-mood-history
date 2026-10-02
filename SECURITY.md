# Security policy

## Reporting a vulnerability

Open a GitHub security advisory for this repository when possible. Do not attach real vault files, journal text, plugin `data.json`, API keys, environment dumps, screenshots of private notes, or generated mood entries to public issues.

Include a minimal synthetic reproduction and the plugin version.

## API keys

Automatic Mood History reads only `GROQ_API_KEY` from the Obsidian process environment. It does not provide a UI for storing API keys and does not intentionally log the key.

If a key may have been exposed, revoke it through the provider and create a replacement.
