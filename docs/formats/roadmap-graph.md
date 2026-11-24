# Format: `roadmap_graph` (v1, planned — Plan 223)

One item = a graph of topics/skills/tools and their prerequisite/next/related edges. This is a **licensed graph** format; the app maps it to a career-roadmap/learning surface in Plan 223. The repo layout does not change when the adapter lands.

```json
{
  "metadata": {
    "item_type": "roadmap_graph",
    "format": "roadmap_graph",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-SA-4.0",
    "source": {
      "url": "https://example.org/roadmaps/frontend",
      "commit": "…",
      "retrieved_at": "2026-11-24"
    },
    "attribution": "Example Org"
  },
  "items": [
    {
      "seed_key": "roadmap:frontend",
      "title": "Frontend",
      "summary": "Browser-side engineering.",
      "nodes": [
        { "seed_key": "roadmap-node:html", "label": "HTML", "kind": "topic", "summary": "Semantic markup." },
        { "seed_key": "roadmap-node:css", "label": "CSS", "kind": "topic", "summary": "Layout and styling." }
      ],
      "edges": [
        { "from": "roadmap-node:html", "to": "roadmap-node:css", "kind": "next" }
      ]
    }
  ]
}
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `seed_key` | yes | `roadmap:<body>` |
| `title` | yes | 1–200 chars |
| `summary` | no | ≤ 1,000 chars |
| `nodes[]` | yes | ≤ 2,000; each `seed_key` `roadmap-node:<body>`, `label`, `kind` (`topic|skill|tool|concept`), optional `summary` ≤ 1,000, optional `url` |
| `edges[]` | yes | ≤ 10,000; `from`/`to` must reference nodes in the same item; `kind` `prerequisite|next|related` |

## Adapter (Plan 223)

- Resolve `roadmap-node:<body>` to a stable roadmap node row; unresolved references are deferred, never invented.
- A graph is applied as a **reviewable batch**, not directly into the catalog. Mapping to `career_paths`/`career_path_steps`, `jobs` or `job_relations` is a Plan 223 decision; the repo format stays neutral.
- The app may render the graph read-only before any mapping.

## License

Only redistributable graphs. Do **not** derive a graph from a source whose license forbids redistribution (see [`external-reference.md`](external-reference.md)). No images, no logos, no external image URLs.

## Caps

≤ 20 roadmaps per file; nodes/edges as above; JSON depth ≤ 32.
