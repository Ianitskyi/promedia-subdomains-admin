# ProMedia Subdomains Admin

Standalone GitHub Pages admin for ProMedia subdomains hosted from GitHub
repositories.

## What it edits

- `ratings.promedia.report` -> `Ianitskyi/Journalism2026`, `content/site.json`
- `communities.promedia.report` -> `Ianitskyi/promedia-communities`,
  `content/site.json` and `data/communities.json`
- `jobs.promedia.report` -> `Ianitskyi/promedia-jobs`, `js/data.js`

## Security model

This is a static frontend. It cannot keep a GitHub token secret on a server.
The user pastes a fine-grained GitHub token in the browser, and the app sends
it only to `api.github.com`.

Recommended token:

- Fine-grained personal access token
- Repository access only for the configured repositories
- Repository permission: `Contents: Read and write`
- No organization/admin/billing permissions

Use the "remember on this device" checkbox only on a trusted computer.

## Deployment

The app is static. Serve the repository root with GitHub Pages.
