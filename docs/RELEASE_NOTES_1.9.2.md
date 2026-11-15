# Restore the chart from monthly notes

When saved history is empty, Automatic Mood History now restores records from the recovery data in its monthly notes at startup. It redraws the dashboard using the saved scores. Recovery doesn't run analysis or call Groq.

Use **Restore from monthly notes** on the empty dashboard or **Automatic Mood History: Restore history from monthly notes** in the command palette to recover missing records after sync. Restore preserves existing scores and leaves monthly notes intact.

Monthly exports are also protected against writes that would discard saved records missing from the plugin's data file.
