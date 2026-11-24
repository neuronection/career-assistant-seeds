# Minimal pack template

This directory is a checklist, not a second copy of a pack. The canonical minimal pack in this repository is [`packs/neuronection/greece-ats`](../../packs/neuronection/greece-ats) — it is valid and the repo validator checks it.

To start a pack:

1. Copy an existing pack under `packs/` to `packs/<your-publisher>/<your-pack>/`.
2. Rename the directory, the `manifest.json` `id` (`<your-publisher>-<your-pack>`), and the item file.
3. Replace the item `seed_key`/`slug`/`config` with your data.
4. Set `manifest.version` (start at `1.0.0`), `license`, `priority` and `item_files[].sha256`.
5. Add the pack to the root `seed-repo.json` with `path`, `manifest`, `itemTypes`, `license`, `version`, `digest` (leave the digest wrong at first).
6. Run `node scripts/validate.mjs`. It prints the computed item sha256 and pack digest when they are wrong; copy them in and rerun until `OK`.
7. Commit; open a PR; tag a release.

The layout is deliberately fixed: `packs/<publisher>/<pack>/manifest.json` + `items/<format>/…`. New formats are new `items/<format>/` directories with a new `format_version`; they do not change the directory structure.
