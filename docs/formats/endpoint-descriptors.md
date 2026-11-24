# Format: `endpoint_descriptors` (v1)

One item = one public endpoint hint (server, method/path, auth type, docs). It powers the “Swagger-like” endpoints tab and prefills the custom-source wizard. It is not executed by a pack; a probe is an explicit admin action with a connector-domain allowlist.

## Envelope

```json
{
  "metadata": {
    "item_type": "endpoint_descriptors",
    "format": "endpoint_descriptors",
    "format_version": 1,
    "dataset_vintage": "2026-11-24",
    "license": "CC-BY-4.0"
  },
  "items": [
    {
      "seed_key": "endpoint:recruitee-offers",
      "label": "Recruitee offers",
      "connector_key": "recruitee",
      "server": "https://{company}.recruitee.com",
      "method": "GET",
      "path": "/api/offers/",
      "auth": "none",
      "params": [{ "name": "company", "required": true }],
      "docs_url": "https://docs.recruitee.com/",
      "countries": ["GR"]
    }
  ]
}
```

## Fields

| Field | Required | Notes |
|---|---|---|
| `seed_key` | yes | `endpoint:<body>` |
| `label` | yes | 1–120 chars |
| `connector_key` | yes | registry key; e.g. `ats_api` for Greenhouse/Lever/Ashby |
| `platform` | no | e.g. `greenhouse`, `lever`, `ashby`; goes into `params` |
| `server` | yes | https only; no userinfo/query/fragment; must sit inside the connector's declared domains |
| `method` | yes | `GET` (v1; other methods reserved) |
| `path` | yes | begins `/`; no `..`; bounded |
| `auth` | yes | `none`, `api_key`, `bearer`, `oauth` — a descriptor, never a value |
| `params` | no | `{name, required, type?}`; bounded |
| `docs_url` | no | https only |
| `countries` | no | ISO alpha-2 |

## Caps

≤ 100 items per file; `params` ≤ 20; strings bounded.

## Probe

The app may probe an endpoint only as an **admin** action, only when the target host is inside the named connector's declared `domains`, through the guarded runtime, with redirects/private ranges refused. The response is reduced to `{status, elapsed_ms, content_type}`; no body is returned. `PROBE_TARGET_DENIED` otherwise. A descriptor-only endpoint with no connector is display-only, never probed.

## License

Endpoint facts (URLs, auth type) are not the provider's documentation; do not copy documentation text. `docs_url` is a link-out.
