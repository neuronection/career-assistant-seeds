# Versioning

A seed repository has three independent version axes. Do not collapse them into one number.

| Axis | Field | Bumps when | Old readers |
|---|---|---|---|
| Repository layout | `seed-repo.json` `schemaVersion` | the root index or the `packs/` layout changes shape | refuse an unknown major with a clear error |
| Pack format | `manifest.json` `schema_version` | the pack envelope changes shape | refuse an unknown major |
| Item format | item `metadata.format` + `format_version` | the item wire shape or adapter changes | store the version, show “unsupported format”, never execute |
| Pack content | `manifest.json` `version` (semver) | item content changes | older versions remain in git; the index lists the current one |
| Data vintage | `metadata.dataset_vintage` | the facts’ as-of date changes | display only; never a version substitute |

## Semver rules for pack content

- **patch** — corrected facts, no shape change (an opening count, a typo).
- **minor** — additive items or optional fields.
- **major** — removed/renamed items, or a breaking item shape (which normally also bumps the item `format_version`).

## Digests

- `manifest.item_files[].sha256` is the raw sha256 of each item file.
- The **pack digest** is sha256 over the canonical manifest (sorted keys, no whitespace, no timestamps) followed by each item file in `item_files` order as `path + \0 + bytes`.
- `seed-repo.json` carries the pack digest. The app recomputes it and refuses `DIGEST_DRIFT`.
- `null` signatures are valid in v1; the app still requires admin approval.

## Tags

- One immutable tag per release: `v2026.11.24` or `v2026.11.24.2`.
- Never move or delete a released tag. A correction is a new version + new tag.
- The app pins a tag/commit; `main` is for review, not for production pinning.

## Additive evolution

These do not require a breaking change:

- a new `item_type`/`format` under a new `items/<format>/` directory;
- a new optional `x-*` metadata key;
- a new transport (HTTPS registry, private/paid) serving the same tree;
- a signature object replacing `null`;
- a new pack under `packs/<publisher>/`.

Only a change to the root index fields or the pack envelope itself justifies a `schemaVersion` / `schema_version` bump.
