# Format: `metric_dimensions` (v1)

One item = one entry of the metric registry (interest, work value, work style,
constraint or aptitude family).

```json
{
  "metadata": {
    "item_type": "metric_dimensions",
    "format": "metric_dimensions",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "metric-dimension:interest.realistic",
      "key": "interest.realistic",
      "label": "Realistic",
      "group": "interest",
      "description": "Vocational interest affinity (RIASEC) derived from your interest tags.",
      "scale": "scalar",
      "reverse_score": false,
      "sources": ["profile.interests"],
      "consumers": ["fit.interests"]
    }
  ]
}
```

- `seed_key` is `metric-dimension:<key>`; `key` is the registry key
  (`[a-z0-9][a-z0-9._-]{0,59}`, dotted families such as `values.autonomy`).
- `group` is one of `interest`, `value`, `workstyle`, `constraint`, `aptitude`.
- `label` ≤ 80 chars; `description` ≤ 400; `scale` is `scalar` or `vector`;
  `reverse_score` flips the sign of a written component value.
- `sources` and `consumers` are free-form provenance strings (≤ 20 each); the
  app reads them for display, never for dispatch.
- Caps: ≤ 200 dimensions per file.
- Apply publishes the dimension immediately. Retirement sets `status='retired'`
  and the registry stops offering it; rows are never deleted (user metric rows
  reference them with `ON DELETE RESTRICT`).
- The RIASEC **letter** vocabulary itself is structural app code; only the
  dimensions and the category→letter anchors travel as data.
- Bank packs require the `official` or `operator` trust tier; a community pack
  is refused at plan time.
