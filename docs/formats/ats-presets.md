# Format: `ats_presets` (v1)

One item = one employer tenant on a public ATS feed. The app offers it as a one-click job source.

## Envelope

```json
{
  "metadata": {
    "item_type": "ats_presets",
    "format": "ats_presets",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "ats-preset:affideagreece",
      "slug": "affideagreece",
      "name": "Affidea Greece",
      "connector_key": "recruitee",
      "platform": "Recruitee",
      "category": "ats",
      "country": "GR",
      "openings": 32,
      "verified_at": "2026-11-23",
      "config": { "company": "affideagreece" }
    }
  ]
}
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `seed_key` | yes | `<type>:<body>`, exactly one colon; body `[a-z0-9][a-z0-9._/-]{0,119}`; immutable |
| `slug` | yes | `/^[a-z0-9][a-z0-9-]{0,79}$/`; becomes `job_sources.key`; display/UX only |
| `name` | yes | 1–200 chars |
| `connector_key` | yes | must exist in the app's connector registry |
| `platform` | yes | ATS platform label (Recruitee, Teamtailor, Workable, …) |
| `category` | yes | `ats` or `remote` |
| `country` | no | ISO 3166-1 alpha-2 |
| `openings` | no | non-negative integer, dated snapshot |
| `verified_at` | no | ISO date of the last live probe |
| `config` | yes | connector-specific; validated against the connector's schema at parse and apply |
| `logo` | forbidden | external image URLs are stripped |

## Caps

≤ 300 items per file; `config` ≤ 20 entries; each value a string.

## Multiple ATS, countries and remote

- A pack may mix connectors (`recruitee`, `teamtailor`, `workable`, `personio`, `join_com`, `ats_api`, `jobicy`, …); `connector_key` is per item.
- `country` is the item's **primary market** (ISO 3166-1 alpha-2). A pack may contain items for several countries; the gallery's country lens groups them.
- **Remote / worldwide:** set `category: "remote"` and omit `country`. The app groups it under **Worldwide** (`WW`), not a country.

```json
{
  "seed_key": "ats-preset:jobicy",
  "slug": "jobicy",
  "name": "Jobicy",
  "connector_key": "jobicy",
  "platform": "Jobicy",
  "category": "remote",
  "config": {}
}
```

- **Multi-country employer:** v1 has one `country` per item. When the gallery must show the same employer under more than one country lens, emit one item per country with a distinct `seed_key`/`slug` (`acme-gr`, `acme-de`). A `countries: string[]` field would be an additive `format_version` 2 change (app adapter + schema), **not** a repository layout change.
- **Regions:** there is no `region` field in v1. A DACH pack simply contains DE/AT/CH items; the country lens filters them. A pack can also be worldwide-only (remote).
- **Scoping:** one pack per coverage scope/tier keeps versioning independent, e.g. `packs/neuronection/greece-ats`, `packs/neuronection/dach-ats`, `packs/neuronection/remote-boards`. The root `seed-repo.json` lists all packs; the app can add one pack or discover all.
- **Priority is per pack:** keep official/operator (`100`), community (`150`) and local/user (`180`) in separate packs rather than mixing tiers in one pack.

## License and identity

- The pack license must allow redistribution of the tenant/config facts.
- `seed_key` is identity; a rename changes `slug`, not `seed_key`.
- A rename/retirement uses the pack `replaces` list with colon-free key bodies (`ats-preset.old-slug`).
- The app never creates a `job_sources` row from a pack item automatically; the admin enables a preset, then the source is created.
