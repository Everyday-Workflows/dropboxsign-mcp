# Dropbox Sign MCP Server

Local-only MCP server for Dropbox Sign with:

- stdio transport for desktop MCP clients
- Dropbox Sign API-key auth from your local shell environment
- local contracts directory discovery (any folder of markdown files)
- markdown-to-branded-PDF rendering for contracts, including a cover page with logo support
- template draft creation for branded reusable agreements
- signature request send/list/get/download tools
- local downloads for completed documents and template files

## Why this design

- **Transport:** stdio is the recommended fit for local MCP servers.
- **Auth:** for opencode/local-only usage, Dropbox Sign API-key auth is the simplest and most reliable path.
- **Branding:** Dropbox Sign applies branding via `client_id` on signature/template operations when your API app is configured for premium branding.
- **Contracts:** markdown contracts from any local directory can be rendered locally to branded PDF before upload, eliminating browser-based markdown-to-PDF tools.

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
# Optional: only set this if you keep contracts under one stable root directory
DROPBOXSIGN_CONTRACTS_DIR=/absolute/path/to/your/contracts
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

If your contracts live in different client/project folders each time, you can leave `DROPBOXSIGN_CONTRACTS_DIR` unset and pass absolute `sourcePath` values directly to the render/send tools.

## Using direct file paths

If you do **not** set `DROPBOXSIGN_CONTRACTS_DIR`, you can still use the MCP server by passing absolute file paths directly in prompts and tool calls.

Examples:

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

## Set environment variables by OS

### Linux

Add to `~/.bashrc`:

```bash
export DROPBOXSIGN_API_KEY="your_api_key_here"
export DROPBOXSIGN_TEST_MODE="true"
export DROPBOXSIGN_CLIENT_ID="your_client_id_here"
# Optional: only set if you have one stable contracts root
export DROPBOXSIGN_CONTRACTS_DIR="/home/yourname/contracts"
export DROPBOXSIGN_SIGNER_NAME="Your Name"
export DROPBOXSIGN_SIGNER_EMAIL="you@example.com"
export DROPBOXSIGN_SIGNER_ROLE="Service Provider"
export DROPBOXSIGN_BRAND_NAME="My Company"
export DROPBOXSIGN_LOGO_PATH="/home/yourname/assets/logo.webp"
export DROPBOXSIGN_GENERATED_DIR="/home/yourname/dropboxsign/generated"
export DROPBOXSIGN_DOWNLOAD_DIR="/home/yourname/dropboxsign/downloads"
```

Then reload:

```bash
source ~/.bashrc
```

### macOS

Add to `~/.zshrc`:

```bash
export DROPBOXSIGN_API_KEY="your_api_key_here"
export DROPBOXSIGN_TEST_MODE="true"
export DROPBOXSIGN_CLIENT_ID="your_client_id_here"
# Optional: only set if you have one stable contracts root
export DROPBOXSIGN_CONTRACTS_DIR="/Users/yourname/contracts"
export DROPBOXSIGN_SIGNER_NAME="Your Name"
export DROPBOXSIGN_SIGNER_EMAIL="you@example.com"
export DROPBOXSIGN_SIGNER_ROLE="Service Provider"
export DROPBOXSIGN_BRAND_NAME="My Company"
export DROPBOXSIGN_LOGO_PATH="/Users/yourname/assets/logo.webp"
export DROPBOXSIGN_GENERATED_DIR="/Users/yourname/dropboxsign/generated"
export DROPBOXSIGN_DOWNLOAD_DIR="/Users/yourname/dropboxsign/downloads"
```

Then reload:

```bash
source ~/.zshrc
```

If you use Bash on macOS, use `~/.bash_profile` instead.

### Windows

#### Option A — Environment Variables UI

1. Open **Start** → search **Environment Variables**
2. Open **Edit the system environment variables**
3. Click **Environment Variables**
4. Add the `DROPBOXSIGN_*` variables under **User variables**
5. Restart your terminal and MCP client

#### Option B — PowerShell profile

```powershell
notepad $PROFILE
```

Add:

```powershell
$env:DROPBOXSIGN_API_KEY = "your_api_key_here"
$env:DROPBOXSIGN_TEST_MODE = "true"
$env:DROPBOXSIGN_CLIENT_ID = "your_client_id_here"
# Optional: only set if you have one stable contracts root
$env:DROPBOXSIGN_CONTRACTS_DIR = "C:\Users\yourname\contracts"
$env:DROPBOXSIGN_SIGNER_NAME = "Your Name"
$env:DROPBOXSIGN_SIGNER_EMAIL = "you@example.com"
$env:DROPBOXSIGN_SIGNER_ROLE = "Service Provider"
$env:DROPBOXSIGN_BRAND_NAME = "My Company"
$env:DROPBOXSIGN_LOGO_PATH = "C:\Users\yourname\assets\logo.webp"
$env:DROPBOXSIGN_GENERATED_DIR = "C:\Users\yourname\dropboxsign\generated"
$env:DROPBOXSIGN_DOWNLOAD_DIR = "C:\Users\yourname\dropboxsign\downloads"
```

Reload:

```powershell
. $PROFILE
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

## Implemented tools

- `dropboxsign_auth_status`
- `dropboxsign_verify_account`
- `dropboxsign_list_contracts`
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
- cancel signature request
- send reminder
- update signer details after send
- download signature request files to local storage

Not supported yet:
- reorder or modify in-flight requests beyond signer update
- release hold / remove access / split embedded flows
- file URL / data URI variants
- embedded signing and other embedded signature request helper endpoints

If a Dropbox Sign feature is missing, treat that as "not wrapped by this MCP server yet" rather than "unsupported by Dropbox Sign itself."

## Contract workflow

1. If you configured `DROPBOXSIGN_CONTRACTS_DIR`, find a contract with `dropboxsign_list_contracts`.
2. Otherwise, skip listing and pass the absolute contract path directly to `dropboxsign_contract_render_pdf` or `dropboxsign_signature_request_send`.
3. Render markdown to PDF with `dropboxsign_contract_render_pdf`.
4. Either:
   - send it directly with `dropboxsign_signature_request_send`, or
   - create a reusable template draft with `dropboxsign_template_create_embedded_draft` and place fields in Dropbox Sign’s embedded editor.
5. Download executed files locally with `dropboxsign_signature_request_download`.

The default template now renders a dedicated branded cover page on page 1 and starts the contract body on page 2.

## Current limitations

- This v1 server targets **local stdio** only.
- Auth currently uses **Dropbox Sign API keys**, not OAuth.
- Receiving Dropbox Sign callback events is not implemented yet; the practical v1 path is polling/listing plus explicit downloads.
- Premium branding depends on your Dropbox Sign plan and configured API app `client_id`.
- Markdown rendering uses the bundled `templates/default.html` and `templates/default.css`; you can replace them with your own brand system.
