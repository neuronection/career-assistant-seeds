# Format: `assessment_templates` (v1)

One item = one immutable version of an assessment battery template.

```json
{
  "metadata": {
    "item_type": "assessment_templates",
    "format": "assessment_templates",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "assessment-template:riasec-interest-battery/v1",
      "key": "riasec-interest-battery",
      "version": 1,
      "title": "RIASEC interest battery",
      "description": "Six self-ratings that map your interests onto the registry's RIASEC dimensions.",
      "audience_stages": [],
      "language": "en",
      "schema_version": 1,
      "content": {
        "schema_version": 1,
        "phases": [
          {
            "title": "RIASEC interest battery",
            "questions": [
              {
                "kind": "slider",
                "prompt": "Rate your interest in hands-on, equipment and outdoors work.",
                "dimension_key": "interest.realistic",
                "numeric_min": 1,
                "numeric_max": 10,
                "cap": 10
              }
            ]
          }
        ]
      }
    }
  ]
}
```

- `seed_key` is `assessment-template:<key>/v<version>`; the body is the template identity plus its version, never a title.
- `key` is a slug; `version` is a positive integer; `language` is a two-letter code; `schema_version` is 1..99.
- `content` is the validated template document (`phases[]` → `questions[]`); the app refuses a content body its schema does not accept.
- Caps: ≤ 20 template versions per file.
- A published version is **immutable**: re-applying the same version with different content is a plan-time conflict. A correction bumps `version` and ships as a new item; the previous row stays resolvable.
- Retirement sets `status='retired'`; rows are never deleted, so runs that used an older version still resolve it.
- Bank packs require the `official` or `operator` trust tier; a community pack is refused at plan time.
