---
name: dropboxsign-mcp-setup
description: >
  Guided setup workflow for the Dropbox Sign MCP server in this repository.
  Use when installing dependencies, configuring DROPBOXSIGN_* environment
  variables, wiring the server into OpenCode or Claude Desktop, setting vault,
  logo, output directories, or validating first-run commands. References
  README.md, .env-style variables, templates/default.html, and templates/default.css.
user-invocable: true
---

# Dropbox Sign MCP Setup

Use this skill when setting up, reconfiguring, or troubleshooting the local Dropbox Sign MCP server in this repo.

## What this skill does

Guide the user through:

1. installing prerequisites
2. setting required environment variables
3. registering the MCP server in OpenCode or Claude Desktop
4. configuring branding, vault, and output directories
5. validating the server with the built-in Dropbox Sign MCP tools

## Preconditions

Before setup, confirm the user has:

- a Dropbox Sign API key
- Node.js and npm installed
- access to this repository locally
- run or is willing to run `npx playwright install chromium`

## Required environment variables

Minimum required:

```bash
export DROPBOXSIGN_API_KEY="..."
```

Common recommended variables:

```bash
export DROPBOXSIGN_TEST_MODE="true"
export DROPBOXSIGN_CLIENT_ID="..."
export DROPBOXSIGN_VAULT_PATH="/absolute/path/to/Obsidian/vault"
```

Optional branding and output variables:

```bash
export DROPBOXSIGN_BRAND_NAME="Everyday Workflows"
export DROPBOXSIGN_LOGO_PATH="/absolute/path/to/logo.webp"
export DROPBOXSIGN_GENERATED_DIR="/absolute/path/to/generated"
export DROPBOXSIGN_DOWNLOAD_DIR="/absolute/path/to/downloads"
export DROPBOXSIGN_TEMPLATE_DIR="/absolute/path/to/templates"
```

## Setup workflow

### 1. Install dependencies

From the repo root:

```bash
npm install
npx playwright install chromium
```

### 2. Build the server

```bash
npm run build
```

The current built entrypoint is:

```bash
dist/src/index.js
```

### 3. Register the MCP server

#### OpenCode

Add an MCP entry that points to:

```json
{
  "type": "local",
  "command": [
    "node",
    "/absolute/path/to/dropboxsign-mcp/dist/src/index.js"
  ],
  "environment": {
    "DROPBOXSIGN_API_KEY": "{env:DROPBOXSIGN_API_KEY}",
    "DROPBOXSIGN_CLIENT_ID": "{env:DROPBOXSIGN_CLIENT_ID}",
    "DROPBOXSIGN_VAULT_PATH": "{env:DROPBOXSIGN_VAULT_PATH}",
    "DROPBOXSIGN_TEST_MODE": "{env:DROPBOXSIGN_TEST_MODE}",
    "DROPBOXSIGN_GENERATED_DIR": "{env:DROPBOXSIGN_GENERATED_DIR}",
    "DROPBOXSIGN_DOWNLOAD_DIR": "{env:DROPBOXSIGN_DOWNLOAD_DIR}",
    "DROPBOXSIGN_TEMPLATE_DIR": "{env:DROPBOXSIGN_TEMPLATE_DIR}",
    "DROPBOXSIGN_BRAND_NAME": "{env:DROPBOXSIGN_BRAND_NAME}",
    "DROPBOXSIGN_LOGO_PATH": "{env:DROPBOXSIGN_LOGO_PATH}"
  }
}
```

#### Claude Desktop

Use the same entrypoint and pass the same environment variables in the MCP config.

### 4. Restart the MCP client

After changing env vars or MCP config, restart OpenCode or Claude Desktop before testing.

## First-run verification

Run these tools in order:

1. `dropboxsign_auth_status`
2. `dropboxsign_vault_list_contracts`
3. `dropboxsign_template_list`
4. `dropboxsign_signature_request_list`

Expected success checks:

- `authMethod` is `api_key`
- `apiKeyConfigured` is `true`
- `clientIdConfigured` is `true` when branding is configured
- vault listing returns contract markdown files if a vault path is set

## First useful workflow

Use this order:

1. find a contract with `dropboxsign_vault_list_contracts`
2. render it with `dropboxsign_contract_render_pdf`
3. create an embedded template draft with `dropboxsign_template_create_embedded_draft`
4. open the returned `editUrl` in Dropbox Sign
5. later send or download documents with the signature request tools

## Cover-page and branding notes

- The default template uses `templates/default.html` and `templates/default.css`.
- The renderer can create a branded cover page with logo support.
- Use `DROPBOXSIGN_LOGO_PATH` to point to a logo image.
- Use `DROPBOXSIGN_BRAND_NAME` to control the brand label on the cover page.

## Troubleshooting

If the MCP server connects but Dropbox Sign tools fail:

1. run `dropboxsign_auth_status`
2. verify `DROPBOXSIGN_API_KEY` exists in the MCP client environment
3. confirm the built path is `dist/src/index.js`
4. rebuild with `npm run build`
5. restart the MCP client

If PDF rendering fails:

1. run `npx playwright install chromium`
2. verify the logo path exists if branding is enabled
3. inspect generated HTML in the generated directory

If vault listing fails:

1. verify `DROPBOXSIGN_VAULT_PATH`
2. confirm the vault contains markdown contracts
3. ensure the path is readable by the local process

## Files to inspect during setup

- `README.md`
- `AGENTS.md`
- `templates/default.html`
- `templates/default.css`
- `src/config.ts`
- `src/mcp/server.ts`

## Related skills

- `authoring-skills` — for modifying or extending this setup skill
