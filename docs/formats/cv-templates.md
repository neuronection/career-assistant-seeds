# Format: `cv_templates` (v1)

One item = one immutable version of a CV layout template.

```json
{
  "metadata": {
    "item_type": "cv_templates",
    "format": "cv_templates",
    "format_version": 1,
    "dataset_vintage": "2026-11-28",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "cv-template:ats-classic/v2",
      "key": "ats-classic",
      "version": 2,
      "title": "ATS-Safe Classic",
      "description": "Single-column, standard headings, maximal parser compatibility.",
      "language": "en",
      "page_size": "a4",
      "ats_safe": true,
      "content": {
        "blocks": [
          { "kind": "header", "props": { "show_links": true } },
          { "kind": "summary", "props": {} }
        ],
        "design": { "font_stack": "serif" },
        "pages": { "default_max_pages": 1, "overflow_policy": "warn" },
        "prompts": { "field_prompts": {}, "field_handling": "" }
      }
    }
  ]
}
```

- `seed_key` is `cv-template:<key>/v<version>`; the body is the layout identity plus its version.
- `key` is a slug; `version` is a positive integer; `language` is a two-letter code; `page_size` is `a4` or `letter`; `ats_safe` is a boolean hint for the picker.
- `content` is the validated template document: ordered `blocks[]` (kinds from the app's block registry), `design` tokens, `pages` rules and optional `prompts.field_prompts`.
- Caps: ≤ 50 template versions per file.
- Content identity is the canonical hash of the validated `content`. A published version is **immutable**: the same version with a different hash is a plan-time conflict, never an overwrite. A correction bumps `version`.
- A retired version disappears from listing and selection but stays readable by id, so an existing CV built on it still renders. Rows are never deleted (user CVs reference them).
- Bank packs require the `official` or `operator` trust tier; a community pack is refused at plan time.
