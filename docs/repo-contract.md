# Career Seed Repository Contract — v1

**Status:** draft, stable-by-design (2026-11-24)
**Applies to:** `neuronection/career-seeds` and any third-party seed repository that a Career Assistant instance can add.
**Normative words:** MUST / MUST NOT / SHOULD per RFC 2119.

This document is the contract for a **seed repository**: a git repository (or an HTTPS mirror serving the same tree) that publishes versioned, digest-pinned seed packs for Career Assistant. The app treats every repository as **untrusted data**: it parses, validates, stores bytes by digest, and requires an admin to approve the exact digest before apply. No code from a repository is ever executed.

The layout is deliberately three-level versioned so future formats do not force a breaking repo change:

| Level | Field | Owner | Change rule |
|---|---|---|---|
| Repository layout | `seed-repo.json` → `schemaVersion` (integer) | This contract | Breaking layout changes bump it; the app refuses unknown majors |
| Pack envelope | `manifest.json` → `schema_version` (`"1.0"`) | Family seed-pack contract (ADR-0056) | New pack format = new major; app refuses unknown |
| Item format | item envelope → `format` + `format_version` | App adapter registry | New format = new key/version; unknown formats are stored but not applied |

---

## 1. Repository layout

```text
/
├── README.md
├── CONTRIBUTING.md
├── GOVERNANCE.md
├── LICENSE                 # license for the repository's own text/tooling
├── LICENSE-DATA            # default license for packs (each pack may override)
├── seed-repo.json          # REQUIRED root index (discovery + digests)
├── docs/
│   ├── repo-contract.md
│   ├── creating-a-seed-repo.md
│   ├── versioning.md
│   ├── licensing.md
│   ├── security.md
│   └── formats/
│       ├── index.md
│       ├── ats-presets.md
│       ├── endpoint-descriptors.md
│       ├── job-types.md
│       ├── companies.md
│       ├── roadmap-graph.md
│       ├── roadmap-content.md
│       └── external-reference.md
├── schema/
│   ├── seed-repo.schema.json
│   └── item-envelope.schema.json
├── scripts/
│   └── validate.mjs        # repo-level validator (no network)
├── templates/
│   └── minimal-pack/       # checklist; copy an existing pack under packs/
└── packs/
    └── <publisher>/<pack>/
        ├── manifest.json   # REQUIRED family seed-pack manifest
        ├── README.md
        ├── LICENSE         # REQUIRED if it differs from LICENSE-DATA
        ├── CHANGELOG.md
        └── items/
            └── <format>/<name>.json
```

Rules:

- `packs/<publisher>/<pack>/` is the only place a pack may live. `<publisher>` and `<pack>` are kebab-case (`^[a-z][a-z0-9-]{1,63}$`).
- A repository MAY contain one or many packs. A single-pack repository still ships a root `seed-repo.json`.
- `items/` is namespaced by format (`items/ats_presets/…`, `items/endpoint_descriptors/…`, `items/roadmap_graphs/…`). This keeps a future format additive.
- No symlinks, binaries, images, executables, dotfiles or secret material in `packs/`. The repo validator refuses them; the app's pack loader refuses the same.
- `README.md`, `LICENSE`, `CHANGELOG.md` are repository/package documentation, not pack bytes. A pack archive sent to the app contains only `manifest.json` + `items/**.json`.

---

## 2. Root index: `seed-repo.json`

The index is the discovery document. The app fetches/clones the repository, reads this file, and shows the packs. It never scans arbitrary directories to guess.

```json
{
  "schemaVersion": 1,
  "kind": "career-seed-repo",
  "publisher": {
    "id": "neuronection",
    "name": "Neuronection",
    "homepage": "https://neuronection.com",
    "contact": "seeds@neuronection.com"
  },
  "packs": [
    {
      "id": "neuronection-greece-ats",
      "path": "packs/neuronection/greece-ats",
      "manifest": "packs/neuronection/greece-ats/manifest.json",
      "itemTypes": ["ats_presets", "endpoint_descriptors"],
      "license": "CC-BY-4.0",
      "version": "3.0.0",
      "digest": "sha256:…",
      "signature": null
    }
  ]
}
```

- `publisher.id` is stable and MUST match the directory under `packs/`.
- `packs[].id` MUST match the pack's `manifest.json` `id`, and SHOULD be `<publisher>-<pack>`.
- `packs[].path` MUST be `packs/<publisher>/<pack>`.
- `packs[].digest` is the **pack digest** over the canonical manifest + item files (see §5).
- `packs[].signature` is `null` in v1; an ed25519 detached signature is reserved for a later contract (the app still requires admin approval).
- No timestamps in the index or manifests. The git tag/commit is the time anchor; `version` and `digest` identify content.

The same index is valid when served over HTTPS (`GET /seed-repo.json`). A non-git provider can therefore publish the exact same tree; the app's `registry` transport reads the index instead of cloning.

---

## 3. Pack manifest

The pack manifest is the family seed-pack manifest (ADR-0056), unchanged:

```json
{
  "id": "neuronection-greece-ats",
  "schema_version": "1.0",
  "version": "3.0.0",
  "license": "CC-BY-4.0",
  "scope": "system",
  "priority": 100,
  "min_app_version": "0.21.0",
  "description": "Verified Greek employer tenants and their public ATS endpoint descriptors.",
  "item_files": [
    { "path": "items/ats_presets/greece.json", "sha256": "…" },
    { "path": "items/endpoint_descriptors/greece.json", "sha256": "…" }
  ]
}
```

- `schema_version` is the **pack format**, not the repository layout.
- `license` MUST be in the family allowlist (`Apache-2.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC0-1.0`, `MIT`).
- `scope` is `system` for public packs. A future tenant/profile overlay uses a different scope and is out of v1.
- `priority` is the precedence band: bundled `0`, migrated legacy `90`, official/operator `100`, community `150`, local/user `180`.
- `version` is semver content; `revision` is not stored in the pack — the git tag + digest identify the release.
- `min_app_version` is advisory in v1; the app refuses a pack whose `schema_version`/`format_version` it cannot parse, regardless.

---

## 4. Item envelope

Every `items/**/<name>.json` file is an envelope:

```json
{
  "metadata": {
    "item_type": "ats_presets",
    "format": "ats_presets",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0",
    "source": {
      "url": "https://example.org/seed-source",
      "commit": "…",
      "retrieved_at": "2026-11-24"
    },
    "attribution": "Example Org"
  },
  "items": []
}
```

- `item_type` is the semantic type (`ats_presets`, `endpoint_descriptors`, `job_types`, `companies`, `roadmap_graph`, `roadmap_content`, `external_reference`).
- `format` + `format_version` select the app adapter. They are separate from `item_type` so a future wire shape can serve the same semantic type.
- `dataset_vintage` is the as-of date of the facts (not the publish date).
- `metadata` MAY carry `x-*` extension keys. Unknown non-`x-` keys are rejected by the app; the repo validator warns on them.
- The `items[]` shape is format-specific (see `docs/formats/`).
- `license` here MUST match the pack license unless the format explicitly allows a reference-only item.

---

## 5. Versioning, digests and tags

**Three axes, never conflated:**

1. **Repository layout** — `seed-repo.json` `schemaVersion` (`1`). A breaking layout change bumps it (e.g., moving `packs/` or renaming the index).
2. **Pack format** — `manifest.json` `schema_version` (`"1.0"`). A breaking pack envelope change bumps the major; the app refuses unknown majors.
3. **Item format** — `metadata.format_version` (`1`). A new adapter version is additive; unknown versions are stored but not applied.

**Content identity:**

- Each item file has `manifest.item_files[].sha256` (raw bytes).
- The **pack digest** is `sha256` over:
  - the manifest bytes after canonical JSON serialization (sorted keys, no whitespace, no timestamps), then
  - each item file in `item_files` order: its `path` + `\0` + its raw bytes.
- The root index carries that digest. The app recomputes it on fetch and refuses `DIGEST_DRIFT`.
- A release tag is immutable. Use `v<YYYY.MM.DD>` or `v<YYYY.MM.DD>.<n>`; never move a tag. A new release gets a new tag.

**Compatibility rules:**

- Additive fields are allowed in `metadata` only under `x-*`; the app preserves them.
- A new `item_type` or `format` is additive: older apps store the pack version and show "unsupported format"; they do not execute or drop it silently.
- Removing a pack item is a **retire** (`replaces` in the pack manifest), never a silent delete. The app retires only when no other active approved source provides the key.
- A repository may keep old pack versions in git history; the index lists the current version only. The app can pin an older tag explicitly.

---

## 6. Licensing

- The repository's own docs/tooling: `LICENSE` (recommended Apache-2.0).
- Pack data: `LICENSE-DATA` default + per-pack `LICENSE`; the manifest `license` is authoritative.
- Allowed for publication: `Apache-2.0`, `CC-BY-4.0`, `CC-BY-SA-4.0`, `CC0-1.0`, `MIT`.
- **Not allowed for publication:** “personal use only”, “no redistribution”, “all rights reserved”, unknown/`NOASSERTION`, or any license that forbids derivative/redistributed data. Those sources may appear only as `external_reference` items (title/URL/attribution, no content) or as a private, local-only import that is never published or federated.
- Attribution requirements are recorded in `metadata.attribution` and rendered in the UI. No provider logos or copyrighted images are accepted; the app strips external image URLs.

`developer-roadmap` (`nilbuild/developer-roadmap`) is exactly this case: its license allows personal use but forbids publishing the content in any form. Do **not** create a pack from its Markdown. Use `external_reference` or a private local import; the app must not redistribute it.

---

## 7. Security and review

- **Data only.** No code, scripts, macros, shell, `importlib`, HTML, or executable content. The app never runs pack content.
- **No secrets.** No tokens, cookies, private URLs, or credentials. Endpoint `auth` is a descriptor, never a value.
- **No binaries/images.** JSON only; no symlinks, no archive bombs, no path traversal.
- **Caps.** Manifest ≤ 256 KB; item file ≤ 5 MB; pack ≤ 64 MB; ≤ 200 item files; format-specific item caps (see each format doc).
- **CI.** The repository MUST run the repo validator on every PR: root index, pack manifest, item envelope, digests, connector keys, license, caps, no forbidden files.
- **Review.** Protected default branch, 2FA, maintainer allowlist, signed release tags (operator practice), no force-push. A compromised maintainer is still bounded by the app's exact-digest approval.
- **App-side gate.** Even a valid pack is `pending` until an admin approves its exact digest. No auto-apply of remote content.

---

## 8. Discovery and transports

| Transport | How the app reads it |
|---|---|
| `git` (public, canonical) | Clone at a pinned tag/commit, read `seed-repo.json` / pack manifest, verify digests, discard checkout |
| `registry` (HTTPS) | `GET <base>/seed-repo.json` (or a pack manifest URL), guarded fetch, verify digests |
| `file` (local) | Admin uploads a pack; same validation; no network |

A non-git provider (e.g., a future neuronection.com API) serves the same `seed-repo.json` + pack bytes. The app's repository contract does not change; only the transport does. This is why the layout is transport-neutral.

---

## 9. Creating a repository

1. Use `templates/seed-repo` (or the `career-seeds-template` repository) as the starting point.
2. Set `publisher.id`/`name` in `seed-repo.json`; keep the directory `packs/<publisher>/`.
3. Copy an existing pack under `packs/` to `packs/<publisher>/<pack>/` and rename it; edit `manifest.json` and `items/<format>/…`.
4. Run `node scripts/validate.mjs`.
5. Commit; CI validates; tag a release; push. The app adds the repo by URL and pins the tag.

---

## 10. Compatibility promise

The layout is designed so these future additions do **not** require a breaking change:

- new item formats (`roadmap_graph`, `roadmap_content`, `job_types`, `companies`, `market_series`, …) → new `format`/`format_version` and a new `items/<format>/` directory;
- new transports (non-git registry, private/paid) → same root index; transport is app-side;
- new optional metadata → `x-*` keys;
- new pack versions → new tag + version + digest; old tags remain immutable;
- signatures → `signature` object replaces `null` without moving the layout;
- new optional item fields in v1 → e.g. `countries`, `regions`, `worldwide`, `languages`, `work_modes`, `homepage`; additive while no app release consumes the lane, otherwise a `format_version` bump.

A breaking change is only justified if the root index or pack envelope itself changes shape; then `schemaVersion` / `schema_version` bumps and older apps refuse the repository with a clear message.
