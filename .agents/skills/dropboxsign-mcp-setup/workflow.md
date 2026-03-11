# Dropbox Sign MCP Setup Workflow

## Fast path

1. Ask the user to set `DROPBOXSIGN_API_KEY` on their OS using the platform-specific instructions in `SKILL.md`
2. Ask the user to optionally set branding, signer, and output variables the same way
3. Use `DROPBOXSIGN_CONTRACTS_DIR` only if the user has one stable root folder of markdown contracts; otherwise leave it unset and use direct `sourcePath` values per call
4. `npm install`
5. `npx playwright install chromium`
6. `npm run build`
7. Register `dist/src/index.js` in the MCP client
8. Restart the MCP client
9. Run `dropboxsign_auth_status`

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
- do not assume every user has a single contracts root directory

## GitHub-ready expectations

When helping a user from a fresh clone, make sure they know:

- the repo does not ship their API key
- they must install Playwright Chromium once
- MCP clients usually need a restart after env changes
- the generated output directory can be customized globally with env vars
- agents should instruct users how to set env vars, not claim to set them themselves
