# Creating a seed repository

This guide gets a new publisher from zero to a pack a Career Assistant instance can add. The normative contract is [`repo-contract.md`](repo-contract.md).

## 0. Decide what you are publishing

| If you have… | Use |
|---|---|
| employer tenants on a public ATS | `ats_presets` |
| public endpoint URLs/auth hints | `endpoint_descriptors` |
| occupation archetypes | `job_types` (Plan 219) |
| company names/aliases/domains | `companies` (Plan 219) |
| a graph of topics/skills/prerequisites | `roadmap_graph` (Plan 223) |
| Markdown topic content with node ids | `roadmap_content` (Plan 223) |
| a link to a roadmap you may **not** redistribute | `external_reference` (Plan 223) |

If the source is “personal use only”, “no redistribution”, or `NOASSERTION`, stop: do not put its content in a pack. Use `external_reference` (title/URL/attribution) or keep it private.

## 1. Copy the template

Use this repository as a template, or copy an existing pack under `packs/` into your repository.

Set the publisher in `seed-repo.json`:

```json
{
  "schemaVersion": 1,
  "kind": "career-seed-repo",
  "publisher": { "id": "your-org", "name": "Your Org", "homepage": "https://example.org" },
  "packs": []
}
```

`publisher.id` is kebab-case and becomes the directory name `packs/<publisher>/`.

## 2. Create the pack directory

```text
packs/your-org/your-pack/
  manifest.json
  README.md
  LICENSE
  items/ats_presets/your-source.json
```

Pack id: `<publisher>-<pack>` (e.g. `your-org-your-pack`). The manifest `id` must match.

## 3. Write the manifest

```json
{
  "id": "your-org-your-pack",
  "schema_version": "1.0",
  "version": "1.0.0",
  "license": "CC-BY-4.0",
  "scope": "system",
  "priority": 150,
  "min_app_version": "0.21.0",
  "description": "One sentence about the pack.",
  "item_files": [
    { "path": "items/ats_presets/your-source.json", "sha256": "…" }
  ]
}
```

- `priority`: bundled `0`, migrated legacy `90`, official/operator `100`, community `150`, local/user `180`.
- `license`: one of the allowlist. If your data cannot be redistributed, it cannot be a public pack.
- `item_files[].sha256`: the raw sha256 of the item file.
- `version`: bump semver on every content change.

## 4. Write the item envelope

Start with `ats_presets`:

```json
{
  "metadata": {
    "item_type": "ats_presets",
    "format": "ats_presets",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0",
    "source": { "url": "https://example.org/careers", "retrieved_at": "2026-11-24" },
    "attribution": "Your Org"
  },
  "items": [
    {
      "seed_key": "ats-preset:example-tenant",
      "slug": "example-tenant",
      "name": "Example Tenant",
      "connector_key": "recruitee",
      "platform": "Recruitee",
      "category": "ats",
      "country": "GR",
      "openings": 3,
      "verified_at": "2026-11-24",
      "config": { "company": "example" }
    }
  ]
}
```

`seed_key` is the identity: `<type>:<body>`, exactly one colon, body `[a-z0-9][a-z0-9._/-]{0,119}`. The `slug` is display/UX only.

## 5. Add it to the root index

```json
{
  "id": "your-org-your-pack",
  "path": "packs/your-org/your-pack",
  "manifest": "packs/your-org/your-pack/manifest.json",
  "itemTypes": ["ats_presets"],
  "license": "CC-BY-4.0",
  "version": "1.0.0",
  "digest": "sha256:…",
  "signature": null
}
```

Run the validator; it prints the computed digests if they are missing or wrong.

## 6. Validate

```bash
node scripts/validate.mjs
```

The validator checks the index, manifests, envelopes, digests, connector keys, license, caps and forbidden files. Fix every error before opening a PR.

## 7. Publish

- Commit, open a PR, get review.
- Merge; tag a release (`v2026.11.24`), sign the tag if you can.
- Push the tag. Do not move it.
- In Career Assistant: **Settings → Tools → Sources → Add provider → Git repository**, paste the URL and the tag. The pack appears as a pending version; an admin reviews the diff and approves the exact digest.

## 8. Later changes

- New content: new item file (or updated), new `sha256`, new manifest `version`, new pack digest, new tag.
- Removed/renamed item: `replaces` in the manifest, not a silent delete.
- New format: new `items/<format>/` directory + new `format_version`; the repo layout does not change.
- Non-git provider: serve the same `seed-repo.json` and pack bytes over HTTPS; no layout change.
