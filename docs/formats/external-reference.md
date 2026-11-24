# Format: `external_reference` (v1, planned — Plan 223)

One item = a **link and attribution, no content**. This is how a source that cannot be redistributed (e.g. `developer-roadmap`) can still be discoverable without violating its license. The app renders a reference card and a link-out; it never stores the source content, never exports it, never federates it.

```json
{
  "metadata": {
    "item_type": "external_reference",
    "format": "external_reference",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "personal-use-only",
    "attribution": "Kamran Ahmed / roadmap.sh"
  },
  "items": [
    {
      "seed_key": "external:developer-roadmap",
      "title": "developer-roadmap",
      "url": "https://github.com/nilbuild/developer-roadmap",
      "publisher": "nilbuild",
      "license": "personal-use-only",
      "attribution": "Kamran Ahmed / roadmap.sh",
      "summary": "Community roadmaps for developers; link-out only.",
      "retrieved_at": "2026-11-24"
    }
  ]
}
```

## Rules

- No `content`/`markdown`/`body` field. No excerpts. No images.
- `url` is https and is the only actionable link; the app opens it in the user's browser.
- `license` may be a non-allowlisted label here **because no content is redistributed**. It is displayed verbatim.
- `attribution` is required.
- The app must not index linked content, fetch it, or feed it to the model as if it were local content.
- `seed_key` is `external:<body>`; it is a reference identity, not a catalog identity.

## Why this exists

`developer-roadmap` is a useful example: its content is licensed for personal use only and cannot be republished. This format lets a provider say “this source exists, here is the link and the attribution” without pretending the content is part of the pack. If the user has a private, licensed copy, a local-only import is a separate feature with its own license gate; it is never published.
