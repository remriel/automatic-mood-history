# History identity schema 2

A history group is identified by its date basis plus date, not date alone. New results store `v2:<date-basis>:<date>` as their recordIdentity. Existing date keys remain in place. If another basis needs the same date, its storage key is `created:<date>` or `legacy:<date>`. Both records retain their date labels, source paths and individual entry/dashboard links.

This is an additive migration: startup marks historySchemaVersion 2 but does not rename keys, promote legacy provenance, rewrite Markdown or delete historical groups. Pending writes/retries accept the same collision keys. Entry ownership checks include date basis, so a current group cannot replace a same-date legacy entry. Recovery uses the persistence protocol independently for each identity.

To revert to a version 1 plugin, first back up plugin JSON and generated files, then restore the saved pre-upgrade JSON. Extra schema 2 groups and entry files can be retained separately for reimport. Version 1 cannot represent both bases at one date and must not be used to analyze schema 2 storage. There is no lossless single-map downgrade when collisions exist. Tests verify additive upgrade, unchanged original legacy records/Markdown, restart after interruption of the new group, and restoration of the original snapshot without discarding the archived schema 2 result.
