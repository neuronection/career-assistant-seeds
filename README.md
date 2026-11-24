# Neuronection Career Assistant Seeds

The **official seed repository** for Career Assistant: versioned, digest-pinned packs of ATS sources, endpoint descriptors, and later job types, companies and roadmaps. A Career Assistant instance adds this repository by URL and pins a release tag; the app verifies the pack digest and an admin approves the exact digest before anything is applied.

The **packs** are data only. The repository also carries the validator, CI and docs as tooling; Career Assistant never executes repository content.

## Packs

| Pack | Version | Coverage | Formats | License | Vintage | Items |
|---|---|---|---|---|---|---|
| `neuronection-greece-ats` | 1.2.0 | Greece (`GR`) | `ats_presets` v1, `endpoint_descriptors` v1 | CC-BY-4.0 | 2026-11-23 | 17 tenants + 8 endpoint descriptors |
| `neuronection-remote-boards` | 1.0.1 | Worldwide (`WW`) | `ats_presets` v1, `endpoint_descriptors` v1 | CC-BY-4.0 | 2026-11-24 | 3 remote boards + 3 endpoint descriptors |

The pack lives at `packs/neuronection/greece-ats/`; the root index is `seed-repo.json`.

## Add it to Career Assistant

1. **Settings → Tools → Sources → Add provider → Git repository**.
2. Repository URL: this repository.
3. Ref: a release tag (not `main`).
4. Subpath: `packs/neuronection/greece-ats` or `packs/neuronection/remote-boards` (or use the index to pick a pack).
5. Review the pending version diff and **approve the exact digest**.

The official provider tile may also be boot-provisioned by the app; the repository is the source of truth, and the website is a legacy mirror.

## Repository contract

The normative contract is [`docs/repo-contract.md`](docs/repo-contract.md). In short:

- `seed-repo.json` — discovery index (publisher, packs, paths, versions, digests).
- `packs/<publisher>/<pack>/manifest.json` — family seed-pack manifest.
- `packs/<publisher>/<pack>/items/<format>/…` — item envelopes (`format` + `format_version`).
- `scripts/validate.mjs` — repo-level validation (no network).
- `docs/formats/` — per-format schemas and license rules.
- [`docs/identity-and-dedupe.md`](docs/identity-and-dedupe.md) — identity keys and the "add missing" diff.

The layout is versioned on three axes — repo `schemaVersion`, pack `schema_version`, item `format_version` — so new formats are additive and do not require a breaking change. Packs may mix ATS connectors; items may carry a primary `country` plus a `countries` lens set, optional `regions`, `languages`, `work_modes` and `homepage`; a `worldwide` remote item has no country.

## Formats

| Format | Status |
|---|---|
| `ats_presets` | v1 — both packs |
| `endpoint_descriptors` | v1 — both packs |
| `job_types`, `companies` | planned — Plan 219 |
| `roadmap_graph`, `roadmap_content`, `external_reference` | planned — Plan 223 |
| `posting_snapshot` | planned — future; same posting identity as live sync |

## Licensing

Pack data is CC-BY-4.0. The allowed licenses and the “personal use only” exclusion are in [`docs/licensing.md`](docs/licensing.md). In particular, `developer-roadmap` content is personal-use only and **cannot** be republished; it may appear only as an `external_reference` (link/attribution) or a private local import.

## Contributing

A new pack or a data correction is a pull request; CI validates the index, manifests, envelopes, digests, connector keys, license, caps and forbidden files. Releases are immutable tags. See [`CONTRIBUTING.md`](CONTRIBUTING.md), [`GOVERNANCE.md`](GOVERNANCE.md) and [`CODE_OF_CONDUCT.md`](CODE_OF_CONDUCT.md).

Report security issues privately via [`SECURITY.md`](SECURITY.md) — never in a public issue.

## Validate

```bash
node scripts/validate.mjs
```

## Security

No code, secrets, binaries, images or external image URLs. The app stores bytes by digest and requires admin approval; a repository action can never auto-apply content. See [`docs/security.md`](docs/security.md).
