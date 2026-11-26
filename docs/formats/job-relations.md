# Format: `job_relations` (v1)

One item = one typed, weighted edge between two job types.

```json
{
  "metadata": {
    "item_type": "job_relations",
    "format": "job_relations",
    "format_version": 1,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "job-relation:software-developer/ml-engineer/similar-to",
      "from": "software-developer",
      "to": "ml-engineer",
      "type": "similar_to",
      "weight": 0.7,
      "rationale": "Both build software with data."
    }
  ]
}
```

- `seed_key` encodes the edge; key bodies cannot contain `_`, so the relation
  type uses hyphens (`similar_to` → `similar-to`). The codec is app-side.
- `type` is one of `similar_to`, `specialises_into`, `leads_to`,
  `alternative_to`, `prerequisite_of`.
- `from`/`to` must resolve to applied job types.
- A pack-owned edge absent from a newer version is **deleted**; admin/AI edges
  are never touched.
- Caps: ≤ 10,000 edges per file; weight 0..1; rationale ≤ 1,000 chars.
