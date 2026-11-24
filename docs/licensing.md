# Licensing

## Allowed for public packs

- `Apache-2.0`
- `CC-BY-4.0`
- `CC-BY-SA-4.0`
- `CC0-1.0`
- `MIT`

The pack manifest `license` is authoritative. The repository’s own docs/tooling may use a different license (recommended Apache-2.0); `LICENSE-DATA` is the default for packs without their own `LICENSE`.

## Not allowed for public packs

- “personal use only”
- “no redistribution”
- “all rights reserved”
- unknown / `NOASSERTION`
- any license that forbids derivative or redistributed data

Those sources may appear only as:

1. an **`external_reference`** item — title, URL, publisher, license, attribution, summary; **no content**; or
2. a **private, local-only** import that is never published, exported, or federated.

## Attribution

Record required attribution in `metadata.attribution` and the pack `README`. The app renders it. No provider logos or copyrighted images are accepted; external image URLs are stripped.

## The `developer-roadmap` case

`nilbuild/developer-roadmap` is a popular roadmap repository, but its license says, in substance: *personal use only; publishing the content in any form is not allowed.* It is therefore **not** a public pack source.

- Do **not** copy its Markdown into `items/roadmap_content/`.
- Do **not** create a pack from it and publish it.
- A future `external_reference` item may point to it with attribution; a private local import may be possible for the user’s own instance only, never exported or federated.

This is a format-support decision, not a content-license exception. The app can support the roadmap *shape* for content the publisher is allowed to redistribute.

## Changing a license

A license change is a new pack version and a new release tag. The old tag remains immutable. A source that loses redistribution rights is retired, not silently rewritten.
