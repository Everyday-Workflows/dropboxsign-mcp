# Dropbox Sign MCP Setup Workflow

## Fast path

1. Ask the user to set `DROPBOXSIGN_API_KEY` on their OS using the platform-specific instructions in `SKILL.md`
2. Ask the user to set `DROPBOXSIGN_TEMPLATE_DIR` to an absolute directory if they want stable custom contract styling across MCP launch locations
3. Ask the user to optionally set branding, signer, and output variables the same way
4. Use `DROPBOXSIGN_CONTRACTS_DIR` only if the user has one stable root folder of markdown contracts; otherwise leave it unset and use direct `sourcePath` values per call
5. `npm install`
6. `npx playwright install chromium`
7. `npm run build`
8. Register `dist/src/index.js` in the MCP client
9. Restart the MCP client
10. Run `dropboxsign_auth_status`

## Recommended verification sequence

```text
dropboxsign_auth_status
dropboxsign_list_contracts   # optional, only if DROPBOXSIGN_CONTRACTS_DIR is set
dropboxsign_contract_render_pdf
dropboxsign_template_list
dropboxsign_signature_request_list
```

Always inspect `dropboxsign_auth_status.templatesDir` before telling the user where HTML/CSS styling templates live.

## Good defaults for reusable deployments

- keep Dropbox Sign credentials in env vars, not committed files
- set output directories explicitly for shared teams
- set `DROPBOXSIGN_TEMPLATE_DIR` explicitly for shared custom branding
- keep branding assets in a stable absolute path
- use named templates instead of editing `default` for every use case
- do not assume every user has a single contracts root directory

## GitHub-ready expectations

When helping a user from a fresh clone, make sure they know:

- the repo does not ship their API key
- they must install Playwright Chromium once
- MCP clients usually need a restart after env changes
- the generated output directory can be customized globally with env vars
- the resolved template directory is reported by `dropboxsign_auth_status`
- agents should instruct users how to set env vars, not claim to set them themselves
