# Format: `interest_tags` (v1)

One item = one controlled interest vocabulary entry.

```json
{
  "metadata": {
    "item_type": "interest_tags",
    "format": "interest_tags",
    "format_version": 1,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    { "seed_key": "interest:science-physics", "key": "science-physics", "label": "Physics", "category": "science" }
  ]
}
```

- `seed_key` is `interest:<key>`; `key` is the vocabulary key.
- `category` must have a RIASEC anchor in the app (the metric map is an
  interest-category map).
- A removed tag is deprecated (`deprecated=true`), never deleted while referenced.
- Caps: ≤ 1,000 tags per file; description ≤ 500 chars; `kind` is `topic` or `industry`.
