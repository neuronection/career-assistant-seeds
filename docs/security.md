# Security

## Data only

A pack is JSON data. It must not contain code, scripts, macros, shell commands, HTML, templates, or anything the app would execute. The app never imports or runs repository content.

## Forbidden files

- symlinks, hardlinks that escape the pack, absolute paths, `..` segments, backslashes;
- binaries, images, archives, fonts, databases;
- dotfiles, editor state, `.env`, keys, tokens, cookies;
- external image URLs.

The repository validator and the app’s pack loader both refuse these.

## Secrets

A pack must not carry credentials. An endpoint descriptor’s `auth` is a *type* (`none`, `api_key`, `bearer`, `oauth`), never a value. Git source credentials (for private repositories) are a separate app-side secret slot and are not part of a public pack.

## Caps

| Limit | Value |
|---|---|
| Manifest | 256 KB |
| Item file | 5 MB |
| Pack | 64 MB |
| Item files | 200 |
| ATS presets | 300 per pack |
| Endpoint descriptors | 100 per pack |
| JSON depth | 32 |
| JSON nodes | 100,000 |

Format docs add their own item caps. The app enforces the same or tighter values.

## Review and release

- Protected default branch, 2FA, maintainer allowlist.
- CI runs `node scripts/validate.mjs` on every PR.
- Release tags are signed where possible and never moved.
- The app still requires an admin to approve the exact pack digest; a repository action can never auto-apply content.

## Revocation

A bad pack is corrected by a new version and tag, plus a note in the pack `CHANGELOG`. Instances revoke the bad digest and re-apply the previous approved version. A compromised maintainer is bounded by the app’s digest approval, not by repository trust.
