# Automatic Mood History

Explore mood, energy, connection, and intensity across your dated Obsidian notes. The plugin runs offline on desktop, Android, and iPhone. Groq analysis is optional.

![Earlier screenshot of the plugin's 14-day trend view in Obsidian, with four score charts and a day selector](assets/plugin-trend.png)

Both screenshots show the plugin running in Obsidian with fictional journal entries.

## Install

Download `main.js`, `manifest.json`, and `styles.css` from the [latest release](https://github.com/remriel/automatic-mood-history/releases/latest). Copy them into `.obsidian/plugins/automatic-mood-history/` inside your vault, restart Obsidian, and enable **Automatic Mood History** under **Settings → Community plugins**. Requires Obsidian 1.5 or later.

On mobile, you can also install through [BRAT](https://github.com/TfTHacker/obsidian42-brat) using the repository `remriel/automatic-mood-history`.

## Explore your history

1. Choose **Analysis scope** in the plugin settings. The default for new setups, **Scan all except excluded folders**, scans all eligible notes except those in listed folders. Choose **Include specific folders** to limit analysis to the folders you list. A blank include list pauses note analysis. A saved scope carries forward on upgrade. Each mode remembers its own list. Use one vault-relative folder per line. Rules include subfolders, and / matches only root-level notes. Notes with the same detected date contribute to one daily result. Undated filenames use the local creation date.
2. Open **Automatic Mood History: Open mood history dashboard** from the command palette and select **Analyze changed**. Enable automatic analysis in settings if you want future changes picked up.
3. Select a chart range or explore a day. Expand a month under **Day by day** to see summaries, scores, and source notes. Mood, energy, connection, and intensity use a 1–10 scale. Earlier 1–5 scores display as 1, 3, 6, 8, or 10 in the dashboard and refreshed monthly exports. The original values stay in saved history and recovery data. Days with insufficient evidence can appear in history without a plotted score.

![Earlier daily entry showing the analysis method, four scores, an emotion, and a summary](assets/plugin-daily-entry.png)

## Optional Groq analysis

Offline analysis uses Morning Pages word lists. Enabling Groq sends cleaned text from eligible notes to Groq. On Obsidian 1.11.4 or later, save a key in the plugin settings, enable Groq, and select **Check Groq**. Desktop also supports `GROQ_API_KEY`. Use **Retry fallback entries** to revisit locally scored days. For a deliberate full rescan, run **Automatic Mood History: Reanalyze all notes with Groq** from the command palette.

[Privacy and data handling](PRIVACY.md) · [Release history](https://github.com/remriel/automatic-mood-history/releases) · [MIT license](LICENSE)
