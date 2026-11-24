# Identity and deduplication

There are two layers, and they use different identity keys. Neither uses a random UUID as the dedupe key.

## 1. Pack/catalog entities

Powering the preset gallery and endpoint explorer.

| Entity | Natural key | UUID | Unique constraint |
|---|---|---|---|
| Job-source preset | immutable `seed_key` (`ats-preset:<body>`) | `uuid5(NS, "<type>:<body>")` | `(scope_key, seed_key)` |
| Endpoint descriptor | immutable `seed_key` (`endpoint:<body>`) | `uuid5(NS, "<type>:<body>")` | `(scope_key, seed_key)` |

- The planner diffs a new pack version by `seed_key`: `create`, `update`, `noop`, `conflict`, `retire`. A newer pack version with the same keys **updates in place**; it never inserts a duplicate.
- A rename uses the pack's `replaces` list (colon-free key bodies). A removed item is **retired**, not deleted, and only when no other approved source provides it.
- A user-modified row is not auto-updated; the update is surfaced for explicit adoption.
- `seed_item_provenance` records which source version wrote the row; the UUID is derived from the seed key, so a re-seed is id-stable.

## 2. Job postings

The live source path and a future snapshot pack share one identity.

| Entity | Natural key | UUID | Unique constraint |
|---|---|---|---|
| Job posting | `(source_id, external_id)` | random PK + short display `ref` | `(source_id, external_id)` |
| Job posting without an external id | canonical URL hash | random PK | index/grouping, not unique |
| Application | `(user_id, posting_id)` | random PK | `(user_id, posting_id)` |

- `upsert_posting` looks up by `(source_id, external_id)` and compares `content_hash`:
  - new key → insert;
  - existing key + same hash → no-op;
  - existing key + changed hash → update in place, keeping the UUID/`ref`; re-map only if a human has not mapped it;
  - an expired posting that reappears is reactivated and `repost_count` increments.
- A posting missing from the latest list is **expired/retired**, never cascade-deleted while a user has saved/applied to it. `applications` and `posting_interactions` survive.
- `external_id` must be stable for one source. If a provider has no stable id, use the canonical URL hash as the fallback identity; do not use a random UUID or the title.
- The same job on two boards has two different source identities, so it is two rows; the app groups them with `duplicate_of_id` / `duplicate_score` and a review/merge, rather than silently upserting one over the other.
- The `JobPosting` UUID is a primary key and the short `ref` is a display id; the **natural key** is what prevents duplicates.

App references: `backend/app/models/posting_model.py::JobPosting` (`uq_postings_source_external`), `backend/app/services/postings/postings_service.py::upsert_posting`, `backend/app/services/postings/capture_service.py::canonical_url` / `find_by_canonical_url`, `backend/app/services/postings/hygiene_service.py::duplicate_score` / `scan_duplicates` / `merge_duplicate`.

## 3. "Add missing" is a diff, not an append

For a pack update or a snapshot import:

1. Build the incoming identity set (`seed_key` for catalog rows; `(source_id, external_id)` for postings).
2. Insert keys that are not present.
3. Update keys whose content hash changed; leave unchanged keys alone.
4. Do **not** delete keys that are missing. Retire/expire them, preserving user references, and only when no other active source claims them.
5. Record the run (`seed_import_runs` / `SourceRun` / snapshot import run) so the result is auditable and repeatable.

## 4. Future `posting_snapshot` packs

The current seed packs ship presets and endpoints, not posting rows. If a provider publishes a one-shot job-listing snapshot, it uses the same posting identity:

- the pack item carries `source_key` + `external_id` (or a canonical URL);
- the importer resolves or creates a snapshot source and applies `(source_id, external_id)` + `content_hash`;
- missing items are expired/retired after the normal grace period, never deleted;
- no random UUID becomes the identity; the natural key is authoritative.

See [`formats/posting-snapshot.md`](formats/posting-snapshot.md).
