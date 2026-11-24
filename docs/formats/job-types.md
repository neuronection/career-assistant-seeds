# Format: `job_types` (v1, planned — Plan 219)

One item = one occupation archetype. The app stages these into the existing job-type proposal/approval law; it never writes the catalog directly.

```json
{
  "metadata": {
    "item_type": "job_types",
    "format": "job_types",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "job-type:data-analyst",
      "code": "DATA_ANALYST",
      "title": "Data Analyst",
      "family_key": "data",
      "summary": "Turns data into decisions.",
      "skills": [
        { "skill_key": "sql", "importance": "core", "level": 3 },
        { "skill_key": "python", "importance": "core", "level": 2 }
      ],
      "related": [
        { "seed_key": "job-type:bi-analyst", "relation": "similar_to", "weight": 0.7 }
      ]
    }
  ]
}
```

Rules (detailed in Plan 219):

- `seed_key` is identity; `code` is an attribute and may change.
- `family_key`/`skill_key` references resolve against the existing taxonomy; unresolved references are deferred, never invented.
- Duplicate `code`/`title_key` follows the existing job-proposal rules (map-existing first, duplicates blocked).
- The pack applies into a **proposal batch**; an admin approves before the catalog changes.
- Caps: ≤ 500 job types/pack; ≤ 40 skills per type; ≤ 20 related edges.

Status: planned. The repo can store this format now; the app shows “unsupported format” until Plan 219.
