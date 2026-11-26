# Format: `skills` (v1)

One item = one ontology skill node.

```json
{
  "metadata": {
    "item_type": "skills",
    "format": "skills",
    "format_version": 1,
    "dataset_vintage": "2026-11-26",
    "license": "CC-BY-4.0"
  },
  "items": [
    { "seed_key": "skill:programming", "key": "programming", "label": "Programming", "category": "technical" }
  ]
}
```

- `seed_key` is `skill:<key>`; `key` is the ontology key.
- `parent_key` (optional) references another skill; `parent_source` is display provenance.
- A removed skill becomes `status='deprecated'` (resolvable, hidden from pickers);
  user-created skills are untouched.
- Caps: ≤ 2,000 skills per file; description ≤ 500 chars.
