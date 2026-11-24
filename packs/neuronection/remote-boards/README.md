# Neuronection remote boards

- Publisher: `neuronection`
- Pack: `neuronection-remote-boards`
- Version: `1.0.0`
- License: `CC-BY-4.0`
- Data vintage: `2026-11-24`
- Formats: `ats_presets` v1 and `endpoint_descriptors` v1
- Items: 3 worldwide remote boards (Arbeitnow, Jobicy, Remotive), each `category: remote`, `worldwide: true`, `work_modes: [remote]`, plus 3 public endpoint descriptors.

The pack is worldwide; it has no `countries` or `regions`. The gallery groups it under **Worldwide** (`WW`). Source: the public board APIs used by the bundled connectors. The item files are `items/ats_presets/remote-boards.json` and `items/endpoint_descriptors/remote-boards.json`; the manifest pins their sha256 values and the root `seed-repo.json` pins the pack digest.

This pack is data only. Career Assistant stores it by digest and requires an admin to approve the exact digest before applying it.
