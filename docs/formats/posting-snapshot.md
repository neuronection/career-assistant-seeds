# Format: `posting_snapshot` (v1, planned)

**Status:** planned; not implemented in Plan 218. The live source-sync path already deduplicates postings.

One item = one job listing at a point in time, imported from a provider snapshot rather than fetched live. The app applies the same posting identity as the live path, so a later snapshot or live sync cannot duplicate it.

## Envelope

```json
{
  "metadata": {
    "item_type": "posting_snapshot",
    "format": "posting_snapshot",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0",
    "attribution": "Example provider"
  },
  "items": [
    {
      "source_key": "neuronection-greece-ats",
      "external_id": "greenhouse:acme:12345",
      "canonical_url": "https://boards.greenhouse.io/acme/jobs/12345",
      "title": "Data Analyst",
      "org": "Acme",
      "location": { "city": "Athens", "country": "GR", "remote": false },
      "posted_at": "2026-11-20T00:00:00Z",
      "expires_at": null,
      "content_hash": "sha256:…",
      "raw": { "source": "snapshot", "source_key": "…" }
    }
  ]
}
```

## Identity

- Natural key: `(source_id, external_id)` — the same unique constraint as a live posting.
- `source_key` resolves to a `job_sources` row (the provider's source, or a dedicated snapshot source created by the importer).
- If the provider has no stable `external_id`, use `canonical_url` and let the app hash the normalized URL; do **not** use the title, a random UUID or a row position.
- `content_hash` is the change detector: same hash = no-op; changed hash = update in place; missing from the new snapshot = expire/retire, never delete.
- The app keeps the posting UUID/`ref` across snapshots; the natural key is what dedupes.

## "Add missing" semantics

- New identity → insert.
- Existing identity + same content hash → no-op.
- Existing identity + changed hash → update in place; re-map only if a human has not mapped it.
- Missing identity → mark `expired`/retired; keep applications, saves and notes. Retire only when no other active source claims the posting.
- Cross-source duplicates (the same job on two boards) stay two rows and are grouped via `duplicate_of_id` / `duplicate_score`; they are not upserted into one identity.

## Caps and license

- ≤ 5,000 postings per pack; `raw` ≤ 32 KB per item; canonical URL https only.
- Only redistributable listing content may be included. A listing whose text is not redistributable may be represented by a link/attribution reference, not a full snapshot. The app's license gate refuses non-redistributable content.
- No images, HTML, scripts, secrets or personal data in a snapshot.

## Status

Planned. The current seed repo ships `ats_presets` and `endpoint_descriptors`; adding `posting_snapshot` is additive: a new `items/posting_snapshots/` directory and a new `format_version`, with no repository layout change.
