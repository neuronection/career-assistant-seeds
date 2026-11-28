# Format: `metric_category_anchors` (v1)

One item = one interest-category → Holland-letter anchor of the RIASEC map.

```json
{
  "metadata": {
    "item_type": "metric_category_anchors",
    "format": "metric_category_anchors",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [{ "seed_key": "interest-category:science", "category": "science", "letter": "investigative" }]
}
```

- `seed_key` is `interest-category:<category>`; `category` is a taxonomy
  interest category (1..60 chars), exactly one anchor per category.
- `letter` is one of the six Holland codes: `realistic`, `investigative`,
  `artistic`, `social`, `enterprising`, `conventional`.
- Caps: ≤ 200 anchors per file.
- Apply publishes the anchor immediately: interest tags validate their category
  against published anchors at plan time, so a catalog pack carrying interest
  tags is refused until anchors exist.
- Retirement sets `status='retired'`. Retiring an anchor whose category is still
  used by an active interest tag is refused at plan time; rows are never deleted.
- Bank packs require the `official` or `operator` trust tier; a community pack
  is refused at plan time.
