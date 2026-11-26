# Format: `job_types` (v2)

One item = one occupation in the curated job catalog. A trusted catalog pack
(`official`/`operator`) is applied directly after exact-digest approval; the
row's stored `seed_key` is its identity and `code` is an attribute.

```json
{
  "metadata": {
    "item_type": "job_types",
    "format": "job_types",
    "format_version": 2,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "job-type:data-analyst",
      "code": "data-analyst",
      "title": "Data Analyst",
      "family_key": "data",
      "summary": "Turns data into decisions.",
      "attributes": { "experience_typical_years": [0, 3], "demand": "high" },
      "skills": [{ "skill_key": "sql", "required_level": 5, "importance": "important" }],
      "interests": ["science-physics"]
    }
  ]
}
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `seed_key` | yes | `job-type:<body>`; immutable identity |
| `code` | yes | kebab-case attribute; a correction updates it without changing the identity |
| `title` | yes | 1–160 chars; normalized-title duplicates are refused at plan time |
| `family_key` | yes | must resolve to a `job_families` item (same pack or applied catalog) |
| `summary` | no | 1–500 chars, display copy |
| `attributes` | yes | object; carries `experience_typical_years`, subjects, work style, education, physical, salary, demand, environments and the typical positives/negatives |
| `skills` | no | ≤ 40 `{skill_key, required_level?: 1..10, importance?: core\|important\|bonus}`; defaults 5/`important` |
| `interests` | no | ≤ 40 interest-tag keys (the `interest:` seed-key bodies) |

## Rules

- `related[]` is **gone**; typed edges live in `job_relations` v1.
- Unresolved family/skill/interest references fail the apply (`CATALOG_REF_UNRESOLVED`); nothing is invented.
- A row absent from a newer version retires (`status='retired'`) and reappears restored if re-added; UUIDs never change.
- Caps: ≤ 2,000 job types per file; the shared envelope caps the file at 5 MB.
