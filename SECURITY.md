# Security policy

## Reporting a vulnerability

Report privately to **seeds@neuronection.com**. Do not open a public issue for a security problem.

This repository contains **data-only** seed packs. Relevant reports include:

- a pack that carries personal data, secrets, malware-shaped content, or a license that does not allow redistribution;
- a compromised release tag or a digest that does not match the manifest;
- a validator bypass or a path that makes the app execute repository content (it never should);
- an endpoint descriptor that points outside the connector's declared domains.

## Response

We acknowledge reports within a few business days. A confirmed issue is handled by publishing a corrected pack version and a new immutable tag, plus a `CHANGELOG` note; a bad version is revoked by the app's explicit-digest approval. No repository-side action can auto-apply content to an instance.

## Scope

Career Assistant treats every pack as untrusted data, stores bytes by digest, and requires an admin to approve the exact digest. The repository never carries code that the app executes. See [`docs/security.md`](docs/security.md).
