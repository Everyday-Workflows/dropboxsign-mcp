# Dropbox Sign MCP Setup Workflow

## Fast path

1. Export `DROPBOXSIGN_API_KEY`
2. Optionally export branding and vault vars
3. `npm install`
4. `npx playwright install chromium`
5. `npm run build`
6. Register `dist/src/index.js` in the MCP client
7. Restart the MCP client
8. Run `dropboxsign_auth_status`

## Recommended verification sequence

```text
dropboxsign_auth_status
dropboxsign_vault_list_contracts
dropboxsign_contract_render_pdf
dropboxsign_template_list
dropboxsign_signature_request_list
```

## Good defaults for reusable deployments

- keep Dropbox Sign credentials in env vars, not committed files
- set output directories explicitly for shared teams
- keep branding assets in a stable absolute path
- use named templates instead of editing `default` for every use case

## GitHub-ready expectations

When helping a user from a fresh clone, make sure they know:

- the repo does not ship their API key
- they must install Playwright Chromium once
- MCP clients usually need a restart after env changes
- the generated output directory can be customized globally with env vars
