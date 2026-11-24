# Contributing to a Career Seed Repository

## The rule that never bends

**Packs are data.** A contribution may add or change JSON item files, a manifest, or documentation. It must not add code, scripts, images, binaries, secrets, symlinks, or anything the app would execute. The app never runs repository content.

## Before you open a PR

1. Read [`docs/repo-contract.md`](docs/repo-contract.md) and the format doc you are changing.
2. Confirm you have the right to redistribute the data and that its license is in the allowlist (`docs/licensing.md`).
3. Run the validator:
   ```bash
   node scripts/validate.mjs
   ```
   It checks the root index, pack manifests, item envelopes, item digests, connector keys, license, caps and forbidden files.
4. If you add a new pack, add it to `seed-repo.json` and run the validator again.
5. If you change a pack, bump its `version` (semver), update the item file digests in `manifest.json`, and update the pack digest in `seed-repo.json`.

## PR expectations

- One pack or one format change per PR where possible.
- A short description of the source, license, and how the data was obtained.
- No refactors of unrelated packs.
- No moving tags. A released tag is immutable; a correction is a new version and a new tag.
- CI must be green; a maintainer reviews the data and the license.

## Removing data

Do not delete a pack item silently. Use the pack's `replaces` list to retire/rename a `seed_key`; the app retires only when no other active approved source provides it. A whole pack can be deprecated in the index with a final version and a `README` note; keep the git history.

## Reporting a security issue

Do not open a public issue for a vulnerability. Follow [`GOVERNANCE.md`](GOVERNANCE.md) and contact the maintainers privately.
