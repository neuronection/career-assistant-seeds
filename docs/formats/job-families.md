# Format: `job_families` (v1)

One item = one node of the job-family tree. Families are applied before jobs;
children must follow their parent (topological order).

```json
{
  "metadata": {
    "item_type": "job_families",
    "format": "job_families",
    "format_version": 1,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "job-family:technology",
      "key": "technology",
      "label": "Technology",
      "parent_key": null,
      "description": "Software, data and infrastructure roles."
    }
  ]
}
```

- `seed_key` is `job-family:<key>`; `key` is the tree key (immutable in practice).
- `parent_key` references another family in the pack or the applied catalog.
- A removed family retires (`status='retired'`); it may only retire when its
  active jobs are retired or reparented in the same plan.
- Caps: ≤ 200 families per file; description ≤ 2,000 chars.
