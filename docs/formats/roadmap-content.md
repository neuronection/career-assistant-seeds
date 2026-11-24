# Format: `roadmap_content` (v1, planned — Plan 223)

One item = Markdown content for one roadmap node, keyed by a stable node identity. This is the format for content a publisher is **allowed to redistribute**. It is not a graph by itself; pair it with `roadmap_graph` when the graph is also licensed.

```json
{
  "metadata": {
    "item_type": "roadmap_content",
    "format": "roadmap_content",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-SA-4.0",
    "source": { "url": "https://example.org/roadmaps/frontend", "commit": "…", "retrieved_at": "2026-11-24" },
    "attribution": "Example Org"
  },
  "items": [
    {
      "roadmap_seed_key": "roadmap:frontend",
      "node_seed_key": "roadmap-node:html",
      "title": "HTML",
      "markdown": "Semantic markup is the structure of a page.\n\n- elements\n- attributes\n",
      "source_url": "https://example.org/roadmaps/frontend/html"
    }
  ]
}
```

## Rules

- `roadmap_seed_key` and `node_seed_key` must exist in the same pack's `roadmap_graph` item, or the content is held as a deferred reference.
- `markdown` is Markdown only; **no HTML**, no scripts, no embedded images, no external image URLs. The app sanitizes on render and caps the text.
- `title` ≤ 200 chars; `markdown` ≤ 100 KB per item; ≤ 5,000 items per file.
- `source_url` is a link-out, not fetched.
- The license must allow redistribution. If it does not, use `external_reference` or a private local import; never publish it.

## `developer-roadmap` specifically

The `nilbuild/developer-roadmap` repo stores content as `roadmaps/<slug>/content/<topic>@<node-id>.md` and does **not** ship the graph JSON. Its license permits personal use but forbids publishing the content in any form. Therefore:

- **Do not** convert its Markdown into a public `roadmap_content` pack.
- **Do not** publish a graph derived from it either.
- Use an `external_reference` item (title/URL/attribution) or a private, local-only import. The app must never export or federate that content.

The format exists so that licensed roadmap content can be supported later without changing the repository layout. Supporting a *format* is not a license to redistribute a *source*.
