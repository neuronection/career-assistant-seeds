# Formats

A **format** is the wire shape of one item file. The app registers an adapter per `(format, format_version)`. Unknown formats are stored with the pack version but not applied; they are never silently dropped.

| Format | Version | Semantic type | App adapter | Status |
|---|---|---|---|---|
| `ats_presets` | 1 | employer tenants on public ATS feeds | gallery / source creation | Plan 218 |
| `endpoint_descriptors` | 1 | public API endpoint hints | endpoint explorer / wizard prefill | Plan 218 |
| `job_types` | 1 | occupation archetypes | catalog proposal queue | Plan 219 |
| `companies` | 1 | company names/aliases/domains | organization alias proposals | Plan 219 |
| `roadmap_graph` | 1 | topic/skill graph | roadmap adapter | Plan 223 |
| `roadmap_content` | 1 | topic Markdown keyed by node | roadmap content adapter | Plan 223 |
| `external_reference` | 1 | link + attribution, no content | reference card | Plan 223 |
| `posting_snapshot` | 1 | one-shot job listings | snapshot importer (same posting identity) | future |

Adding a format is additive: a new `items/<format>/` directory and a new `format_version`. The repository layout does not change. A breaking change to an existing format bumps `format_version`; the app refuses to apply an unknown version but keeps the bytes.

All formats share the envelope in [`repo-contract.md`](../repo-contract.md) §4. Each format doc defines `items[]`, caps and license rules.
