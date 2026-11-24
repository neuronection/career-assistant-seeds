# Format: `companies` (v1, planned — Plan 219)

One item = one company identity hint. The app stages aliases/domains into the existing organization matcher; it never auto-merges.

```json
{
  "metadata": {
    "item_type": "companies",
    "format": "companies",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "company:example-org",
      "name": "Example Org",
      "aliases": ["Example", "Example Org SA"],
      "domains": ["example.org"],
      "country": "GR",
      "summary": "Optional one-line description."
    }
  ]
}
```

Rules (Plan 219):

- `seed_key` identity; `name`/aliases/domains are attributes.
- Domains are lowercase hostnames, no scheme/path.
- No personal data, no contact emails, no logos.
- The app stages a proposal; an admin accepts/rejects. No auto-merge into `organizations`.
- Caps: ≤ 1,000 companies/pack; ≤ 20 aliases and ≤ 10 domains each.

Status: planned.
