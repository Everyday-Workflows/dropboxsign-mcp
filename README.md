# Dropbox Sign MCP Server

Local-only MCP server for Dropbox Sign with:

- stdio transport for desktop MCP clients
- Dropbox Sign API-key auth from your local shell environment
- Obsidian vault contract discovery
- markdown-to-branded-PDF rendering for contracts, including a cover page with logo support
- template draft creation for branded reusable agreements
- signature request send/list/get/download tools
- local downloads for completed documents and template files

## Why this design

- **Transport:** stdio is the recommended fit for local MCP servers.
- **Auth:** for opencode/local-only usage, Dropbox Sign API-key auth is the simplest and most reliable path.
- **Branding:** Dropbox Sign applies branding via `client_id` on signature/template operations when your API app is configured for premium branding.
- **Contracts:** markdown contracts from your Obsidian vault can be rendered locally to branded PDF before upload, eliminating browser-based markdown-to-PDF tools.

## Verified dependencies

- `@modelcontextprotocol/sdk@1.27.1`
- `@dropbox/sign@1.10.0`
- `markdown-it@14.1.1`
- `playwright@1.58.2`
- `gray-matter@4.0.3`

## Environment

Copy `.env.example` to `.env` and fill in your values, or export them in your shell. See `.env.example` for the full list with comments.

Required:

```bash
DROPBOXSIGN_API_KEY=your_dropbox_sign_api_key
```

Recommended:

```bash
DROPBOXSIGN_TEST_MODE=true
DROPBOXSIGN_CLIENT_ID=your_dropbox_sign_api_app_client_id
DROPBOXSIGN_VAULT_PATH=/absolute/path/to/your/obsidian/vault
```

Signer preset — pre-fill your own details so you don't type them on every send:

```bash
DROPBOXSIGN_SIGNER_NAME=Your Name
DROPBOXSIGN_SIGNER_EMAIL=you@example.com
DROPBOXSIGN_SIGNER_ROLE=Service Provider
```

Optional branding and output:

```bash
DROPBOXSIGN_BRAND_NAME=My Company
DROPBOXSIGN_LOGO_PATH=/absolute/path/to/your/logo.webp
DROPBOXSIGN_GENERATED_DIR=/absolute/path/to/generated
DROPBOXSIGN_DOWNLOAD_DIR=/absolute/path/to/downloads
DROPBOXSIGN_TEMPLATE_DIR=/absolute/path/to/templates
```

## Install

```bash
npm install
npx playwright install chromium
```

## Run locally

```bash
npm run dev
```

Or build:

```bash
npm run build
npm start
```

## Example MCP config

```json
{
  "mcpServers": {
    "dropboxsign": {
      "command": "node",
      "args": ["/absolute/path/to/dropboxsign-mcp/dist/src/index.js"],
      "env": {
        "DROPBOXSIGN_API_KEY": "...",
        "DROPBOXSIGN_CLIENT_ID": "...",
        "DROPBOXSIGN_SIGNER_NAME": "...",
        "DROPBOXSIGN_SIGNER_EMAIL": "...",
        "DROPBOXSIGN_SIGNER_ROLE": "Service Provider",
        "DROPBOXSIGN_VAULT_PATH": "/absolute/path/to/vault",
        "DROPBOXSIGN_TEST_MODE": "true",
        "DROPBOXSIGN_BRAND_NAME": "My Company",
        "DROPBOXSIGN_LOGO_PATH": "/absolute/path/to/logo.webp",
        "DROPBOXSIGN_GENERATED_DIR": "/absolute/path/to/generated",
        "DROPBOXSIGN_DOWNLOAD_DIR": "/absolute/path/to/downloads"
      }
    }
  }
}
```

## Implemented tools

- `dropboxsign_auth_status`
- `dropboxsign_verify_account`
- `dropboxsign_vault_list_contracts`
- `dropboxsign_contract_render_pdf`
- `dropboxsign_template_list`
- `dropboxsign_template_get`
- `dropboxsign_template_create_embedded_draft`
- `dropboxsign_signature_request_send`
- `dropboxsign_signature_request_send_with_template`
- `dropboxsign_signature_request_list`
- `dropboxsign_signature_request_get`
- `dropboxsign_signature_request_cancel`
- `dropboxsign_signature_request_remind`
- `dropboxsign_signature_request_update_signer`
- `dropboxsign_signature_request_download`
- `dropboxsign_template_download`

## Unsupported Dropbox Sign API surface

This repository does **not** currently wrap the full Dropbox Sign API. The MCP server is intentionally focused on local contract rendering, embedded template drafting, signature request sending, listing, getting, and file downloads.

### Not supported at all in this repo yet

- **OAuth endpoints and flows**
- **Account callback / webhook event ingestion**
- **API App management endpoints**
- **Bulk Send Job endpoints**
- **Report endpoints**
- **Team endpoints**
- **Unclaimed Draft endpoints**
- **Fax and Fax Line endpoints**

### Partially supported areas

#### Account API
Supported:
- account verify

Not supported yet:
- other account/profile-management endpoints

#### Template API
Supported:
- list templates
- get template
- download template files
- create embedded template draft

Not supported yet:
- create standard templates outside the embedded-draft flow
- delete templates
- update template files
- add/remove template users
- template file URL / data URI variants

#### Signature Request API
Supported:
- send signature request
- send signature request with template
- list signature requests
- get signature request
- download signature request files to local storage

Not supported yet:
- cancel signature request
- send reminder
- update signer details after send
- reorder or modify in-flight requests
- release hold / remove access / split embedded flows
- file URL / data URI variants
- embedded signing and other embedded signature request helper endpoints

If a Dropbox Sign feature is missing, treat that as "not wrapped by this MCP server yet" rather than "unsupported by Dropbox Sign itself."

## Contract workflow

1. Find an Obsidian contract with `dropboxsign_vault_list_contracts`.
2. Render markdown to PDF with `dropboxsign_contract_render_pdf`.
3. Either:
   - send it directly with `dropboxsign_signature_request_send`, or
   - create a reusable template draft with `dropboxsign_template_create_embedded_draft` and place fields in Dropbox Sign’s embedded editor.
4. Download executed files locally with `dropboxsign_signature_request_download`.

The default template now renders a dedicated branded cover page on page 1 and starts the contract body on page 2.

## Current limitations

- This v1 server targets **local stdio** only.
- Auth currently uses **Dropbox Sign API keys**, not OAuth.
- Receiving Dropbox Sign callback events is not implemented yet; the practical v1 path is polling/listing plus explicit downloads.
- Premium branding depends on your Dropbox Sign plan and configured API app `client_id`.
- Markdown rendering uses the bundled `templates/default.html` and `templates/default.css`; you can replace them with your own brand system.
