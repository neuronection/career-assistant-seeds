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
| `category` | yes | `ats` or `remote`; `ats` requires `country` or `countries`, `remote` may omit both |
| `country` | no | primary ISO 3166-1 alpha-2; if `countries` is set it must be included |
| `countries` | no | ISO alpha-2 list, unique, max 50; the full country-lens set; defaults to `[country]` when absent |
| `regions` | no | uppercase region codes, unique, max 10 (recommended `EU`, `EEA`, `DACH`, `NORAM`, `LATAM`, `APAC`, `MENA`, `AFRICA`) |
| `worldwide` | no | boolean; true for a global/remote source; requires no `countries`/`regions`; only with `category: "remote"` |
| `languages` | no | ISO 639-1, unique, max 20 |
| `work_modes` | no | `remote`, `hybrid`, `onsite`; unique, max 3; a source-level hint |
| `homepage` | no | https URL, max 500; display only |
| `openings` | no | non-negative integer, dated snapshot |
| `verified_at` | no | ISO date of the last live probe |
| `config` | yes | connector-specific; validated against the connector's schema at parse and apply |
| `logo` | forbidden | external image URLs are stripped |

## Caps

≤ 300 items per file; `config` ≤ 20 entries; each value a string.

## Multiple ATS, countries and remote

- A pack may mix connectors (`recruitee`, `teamtailor`, `workable`, `personio`, `join_com`, `ats_api`, `jobicy`, …); `connector_key` is per item.
- `country` is the item's **primary market** (ISO 3166-1 alpha-2); `countries` is the full **country-lens set**. If `countries` is absent it defaults to `[country]`; if both are present, `countries` must include `country`. `category: "ats"` requires `country` or `countries`.
- **Multi-country employer:** one item can carry `country: "GR"` and `countries: ["GR", "DE"]`; the gallery lens shows it under both without duplicating the source.

```json
{
  "seed_key": "ats-preset:acme",
  "slug": "acme",
  "name": "Acme",
  "connector_key": "recruitee",
  "platform": "Recruitee",
  "category": "ats",
  "country": "GR",
  "countries": ["GR", "DE"],
  "config": { "company": "acme" }
}
```

- **Remote / worldwide:** set `category: "remote"` and `worldwide: true`; do not set `countries` or `regions`. The app groups it under **Worldwide** (`WW`).

```json
{
  "seed_key": "ats-preset:jobicy",
  "slug": "jobicy",
  "name": "Jobicy",
  "connector_key": "jobicy",
  "platform": "Remote board",
  "category": "remote",
  "worldwide": true,
  "languages": ["en"],
  "work_modes": ["remote"],
  "homepage": "https://jobicy.com",
  "config": {}
}
```

- **Regional remote:** use `category: "remote"` with `countries` and/or `regions` (and no `worldwide`), e.g. an EU-only remote board.
- **Regions:** optional uppercase codes (`EU`, `EEA`, `DACH`, `NORAM`, `LATAM`, `APAC`, `MENA`, `AFRICA`); a display/filter hint, not a replacement for `countries`. A DACH pack can contain DE/AT/CH items plus `regions: ["DACH"]`.
- **Languages and work modes:** `languages` (ISO 639-1) and `work_modes` (`remote`, `hybrid`, `onsite`) are source-level hints, not a guarantee about every posting; `homepage` is a display-only https link.
- **Scoping:** one pack per coverage scope/tier keeps versioning independent, e.g. `packs/neuronection/greece-ats`, `packs/neuronection/dach-ats`, `packs/neuronection/remote-boards`. The root `seed-repo.json` lists all packs; the app can add one pack or discover all.
- **Priority is per pack:** keep official/operator (`100`), community (`150`) and local/user (`180`) in separate packs rather than mixing tiers in one pack.
- **Versioning:** these fields are **additive optional fields in `format_version: 1`** (2026-11-25). No `format_version` bump is needed because no app release consumes the seed lane yet; a future breaking change to an existing field bumps the version. The repo tag is the release; old tags stay immutable.

## License and identity

- The pack license must allow redistribution of the tenant/config facts.
- `seed_key` is identity; a rename changes `slug`, not `seed_key`.
- A rename/retirement uses the pack `replaces` list with colon-free key bodies (`ats-preset.old-slug`).
- The app never creates a `job_sources` row from a pack item automatically; the admin enables a preset, then the source is created.
