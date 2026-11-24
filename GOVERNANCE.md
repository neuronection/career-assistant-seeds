# Governance

## Publisher

The repository's `publisher.id` is the stable identity of the organisation publishing the packs. It is set once and does not change when a display name changes. A rename is a new `publisher.id` and a new repository, or a documented migration with a `replaces` entry.

## Maintainers

- The default branch is protected; changes arrive through reviewed pull requests.
- 2FA is required for maintainers.
- Release tags are signed by a maintainer (operator practice; the app's manifest signature is a later contract).
- A maintainer list is kept in this repository; changes to it are reviewed like code.

## Data review

Every pack PR is reviewed for:

1. provenance and license (can the content be redistributed?);
2. schema and digest correctness;
3. no personal data, secrets, malware-shaped content, or copyrighted images;
4. no silent deletion — retirements use `replaces`;
5. a sensible `dataset_vintage`.

## Revocation

If a pack is found to be wrong, mislicensed, or malicious:

1. publish a new pack version that retires the affected items (`replaces` / a corrected item set);
2. bump the version and tag a new release;
3. add a `SECURITY` note in the pack `README`/`CHANGELOG`;
4. notify the operator channel. The app does not auto-apply; each instance admin revokes the bad version and re-applies the previous approved one.

A compromised maintainer is still bounded by the app's exact-digest approval and admin revocation. No repository-side action can auto-apply content to an instance.

## Security reports

Report vulnerabilities privately to the maintainers listed in `README.md`; do not open a public issue. The maintainers will acknowledge, assess, and coordinate a fix and a disclosure date. For a data-only repository, the likely issues are license violations, personal data, malicious payloads hidden as data, or a compromised release tag.

## License changes

A pack's license is part of its identity. Changing a license is a new pack version and a new release; the old tag remains immutable. A source that loses redistribution rights is retired, not silently rewritten.
