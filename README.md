# Dropbox Sign MCP Server

Local-first MCP server for Dropbox Sign. It lets desktop MCP clients render markdown contracts to branded PDFs, create embedded template drafts, send signature requests, and download signed files without leaving your local workflow.

> Public alpha: the current focus is local stdio usage, Dropbox Sign API-key auth, and contract-centric automation.

## Features

- local stdio transport for MCP desktop clients
- Dropbox Sign API-key auth from your shell environment
- markdown-to-branded HTML/PDF rendering with a dedicated cover page
- embedded template draft creation from markdown or PDF files
- signature request send, list, get, cancel, remind, update signer, and download flows
- local contracts directory discovery, plus direct absolute-path support when no fixed contracts root is set
- local output directories for rendered documents and downloaded files

## Install

### From npm

```bash
npm install -g @alexautomates/dropboxsign-mcp
npx playwright install chromium
```

### From source

```bash
git clone https://github.com/Everyday-Workflows/dropboxsign-mcp.git
cd dropboxsign-mcp
npm install
npx playwright install chromium
npm run build
```

## Required configuration

Copy `.env.example` to `.env` or export the same variables in your shell.

Minimum required:

```bash
DROPBOXSIGN_API_KEY=your_dropbox_sign_api_key
DROPBOXSIGN_TEST_MODE=true
```

Commonly used optional values:

```bash
DROPBOXSIGN_CLIENT_ID=your_dropbox_sign_api_app_client_id
DROPBOXSIGN_CONTRACTS_DIR=/absolute/path/to/contracts
DROPBOXSIGN_SIGNER_NAME=Your Name
DROPBOXSIGN_SIGNER_EMAIL=you@example.com
DROPBOXSIGN_SIGNER_ROLE=Service Provider
DROPBOXSIGN_BRAND_NAME=My Company
DROPBOXSIGN_LOGO_PATH=/absolute/path/to/logo.webp
DROPBOXSIGN_GENERATED_DIR=/absolute/path/to/generated
DROPBOXSIGN_DOWNLOAD_DIR=/absolute/path/to/downloads
DROPBOXSIGN_TEMPLATE_DIR=/absolute/path/to/templates
```

If your contracts live in different client folders each time, you can leave `DROPBOXSIGN_CONTRACTS_DIR` unset and pass absolute file paths directly to the render/send tools.

For the full annotated variable list, see [`.env.example`](.env.example).

## Quick start

1. Install the package and Chromium for Playwright.
2. Export `DROPBOXSIGN_API_KEY` and set `DROPBOXSIGN_TEST_MODE=true` while validating your setup.
3. Add the MCP server to your client config.
4. Run `dropboxsign_auth_status` to confirm config, directories, and test mode.
5. Render a markdown contract or create a template draft.

## MCP client config

### If installed globally from npm

```json
{
  "mcpServers": {
    "dropboxsign": {
      "command": "dropboxsign-mcp",
      "env": {
        "DROPBOXSIGN_API_KEY": "...",
        "DROPBOXSIGN_CLIENT_ID": "...",
        "DROPBOXSIGN_SIGNER_NAME": "...",
        "DROPBOXSIGN_SIGNER_EMAIL": "...",
        "DROPBOXSIGN_SIGNER_ROLE": "Service Provider",
        "DROPBOXSIGN_CONTRACTS_DIR": "/absolute/path/to/contracts",
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

### If running from source

```json
{
  "mcpServers": {
    "dropboxsign": {
      "command": "node",
      "args": ["/absolute/path/to/dropboxsign-mcp/dist/src/index.js"],
      "env": {
        "DROPBOXSIGN_API_KEY": "...",
        "DROPBOXSIGN_TEST_MODE": "true"
      }
    }
  }
}
```

## Example rendered contract

Fictional sample assets generated with the repo's own markdown-to-PDF flow:

- Source markdown: [`examples/mock-service-agreement.md`](https://github.com/Everyday-Workflows/dropboxsign-mcp/blob/main/examples/mock-service-agreement.md)
- Rendered PDF: [`examples/rendered/mock-service-agreement.pdf`](https://github.com/Everyday-Workflows/dropboxsign-mcp/blob/main/examples/rendered/mock-service-agreement.pdf)

![Mock contract cover](https://raw.githubusercontent.com/Everyday-Workflows/dropboxsign-mcp/main/examples/assets/mock-contract-cover.png)

![Mock contract body](https://raw.githubusercontent.com/Everyday-Workflows/dropboxsign-mcp/main/examples/assets/mock-contract-body.png)

## Example prompts and tool inputs

If you do **not** set `DROPBOXSIGN_CONTRACTS_DIR`, you can still work directly from absolute file paths.

Example prompts:

```text
Render /absolute/path/to/contract.md to PDF
Create an embedded template draft from /absolute/path/to/contract.md
Send /absolute/path/to/contract.pdf for signature
```

Example tool input for `dropboxsign_contract_render_pdf`:

```json
{
  "sourcePath": "/absolute/path/to/contract.md",
  "templateName": "default"
}
```

Example tool input for `dropboxsign_signature_request_send`:

```json
{
  "filePaths": ["/absolute/path/to/contract.md"],
  "signers": [
    {
      "name": "Client Name",
      "emailAddress": "client@example.com"
    }
  ]
}
```

## Implemented tools

### Account and local setup

- `dropboxsign_auth_status`
- `dropboxsign_verify_account`
- `dropboxsign_list_contracts`
- `dropboxsign_contract_render_pdf`

### Templates

- `dropboxsign_template_list`
- `dropboxsign_template_get`
- `dropboxsign_template_create_embedded_draft`
- `dropboxsign_template_download`

### Signature requests

- `dropboxsign_signature_request_send`
- `dropboxsign_signature_request_send_with_template`
- `dropboxsign_signature_request_list`
- `dropboxsign_signature_request_get`
- `dropboxsign_signature_request_cancel`
- `dropboxsign_signature_request_remind`
- `dropboxsign_signature_request_update_signer`
- `dropboxsign_signature_request_download`

## Contract workflow

1. If you configured `DROPBOXSIGN_CONTRACTS_DIR`, find a contract with `dropboxsign_list_contracts`.
2. Otherwise, pass the absolute contract path directly to `dropboxsign_contract_render_pdf` or `dropboxsign_signature_request_send`.
3. Render markdown to PDF with `dropboxsign_contract_render_pdf`.
4. Either send it directly or create a reusable embedded template draft.
5. Download executed files locally with `dropboxsign_signature_request_download`.

The default template renders a dedicated branded cover page on page 1 and starts the contract body on page 2.

## Supported Dropbox Sign surface

This repository intentionally focuses on local contract rendering plus the Dropbox Sign template and signature-request flows most useful inside MCP clients.

### Supported today

- account verification
- template listing, retrieval, download, and embedded-draft creation
- signature request send, send with template, list, get, cancel, remind, update signer, and download

### Not wrapped yet

- OAuth endpoints and flows
- callback / webhook ingestion
- API app management endpoints
- bulk send jobs
- reports
- teams
- unclaimed drafts
- fax and fax line endpoints
- embedded-signing helper endpoints beyond the current template/signature request workflow

If a Dropbox Sign feature is missing here, treat that as “not wrapped by this MCP server yet,” not “unsupported by Dropbox Sign itself.”

## Why this design

- **Transport:** stdio is the right fit for local MCP servers used in desktop clients.
- **Auth:** Dropbox Sign API-key auth is the simplest, most reliable path for local usage.
- **Branding:** rendering happens locally first, then Dropbox Sign applies `client_id` branding where your plan and API app support it.
- **Contracts:** markdown stays editable in your own filesystem until you intentionally render or upload it.

## Development

```bash
npm install
npx playwright install chromium
npm run lint
npm run test
npm run build
```

- Contribution guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Launch/distribution copy: [docs/distribution.md](docs/distribution.md)

## Current limitations

- This server targets **local stdio** usage.
- Auth currently uses **Dropbox Sign API keys**, not OAuth.
- Receiving Dropbox Sign callback events is not implemented yet.
- Premium branding depends on your Dropbox Sign plan and configured API app `client_id`.
- Markdown rendering uses the bundled `templates/default.html` and `templates/default.css` unless you replace them.

## License

[MIT](LICENSE)
