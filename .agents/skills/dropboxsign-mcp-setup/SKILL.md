---
name: dropboxsign-mcp-setup
description: >
  Guided setup workflow for the Dropbox Sign MCP server in this repository.
  Use when installing dependencies, configuring DROPBOXSIGN_* environment
  variables, wiring the server into OpenCode or Claude Desktop, setting the
  contracts directory, logo, output directories, or validating first-run
  commands. Covers Linux, macOS, and Windows. References README.md,
  .env.example, templates/default.html, and templates/default.css.
user-invocable: true
---

# Dropbox Sign MCP Setup

Use this skill when setting up, reconfiguring, or troubleshooting the local
Dropbox Sign MCP server in this repo.

## Agent behavior

- Do **not** inspect, read, modify, or claim to have access to the user's OS-level environment variables.
- Do **not** tell the user that you set `.bashrc`, `.zshrc`, Windows Environment Variables, or PowerShell profile entries unless the user explicitly did that themselves.
- Only instruct the user how to set environment variables on their operating system.
- Treat `DROPBOXSIGN_*` values as user-provided configuration, not something the agent can assume is already available.
- After the user updates environment variables, tell them to restart their MCP client and verify with `dropboxsign_auth_status`.

## What this skill does

Guide the user through:

1. installing prerequisites
2. setting required environment variables (Linux, macOS, Windows)
3. registering the MCP server in OpenCode or Claude Desktop
4. configuring branding, contracts directory, and output directories
5. validating the server with the built-in Dropbox Sign MCP tools

---

## Preconditions

Before setup, confirm the user has:

- a Dropbox Sign API key (from https://app.hellosign.com/home/myAccount#api)
- Node.js 20+ and npm installed
- access to this repository locally
- run or is willing to run `npx playwright install chromium`

---

## Environment variables — full reference

### Required

| Variable | Description |
|---|---|
| `DROPBOXSIGN_API_KEY` | Your Dropbox Sign API key |

### Recommended

| Variable | Description |
|---|---|
| `DROPBOXSIGN_TEST_MODE` | Set to `true` while testing. No real emails sent, no quota used. |
| `DROPBOXSIGN_CLIENT_ID` | Your Dropbox Sign API app client_id. Used for branding. |
| `DROPBOXSIGN_CONTRACTS_DIR` | Optional absolute path to a stable root folder of markdown contract files. If contracts live in different client folders each time, leave this unset and pass `sourcePath` directly to render/send tools. |

### Signer preset ("me")

| Variable | Description |
|---|---|
| `DROPBOXSIGN_SIGNER_NAME` | Your full name — pre-fills your signer info on every send. |
| `DROPBOXSIGN_SIGNER_EMAIL` | Your email address. |
| `DROPBOXSIGN_SIGNER_ROLE` | Your role label in templates. Default: `Service Provider`. Must match the role name in your Dropbox Sign template. |

### Branding

| Variable | Description |
|---|---|
| `DROPBOXSIGN_BRAND_NAME` | Your company name shown on the contract cover page. Default: `My Company`. |
| `DROPBOXSIGN_LOGO_PATH` | Absolute path to your logo image (webp, png, jpg, or svg). |

### Output directories

| Variable | Description |
|---|---|
| `DROPBOXSIGN_GENERATED_DIR` | Where rendered HTML/PDF contracts are saved. Default: `~/.local/share/dropboxsign-mcp/generated` |
| `DROPBOXSIGN_DOWNLOAD_DIR` | Where downloaded signed documents are saved. Default: `~/.local/share/dropboxsign-mcp/downloads` |
| `DROPBOXSIGN_TEMPLATE_DIR` | Where HTML/CSS brand templates live. Default: `./templates` in the repo root. |

---

## Setting environment variables by platform

### Linux

Add to `~/.bashrc` (or `~/.bash_profile` if using login shells):

```bash
export DROPBOXSIGN_API_KEY="your_api_key_here"
export DROPBOXSIGN_TEST_MODE="true"
export DROPBOXSIGN_CLIENT_ID="your_client_id_here"
# Optional: set only if you keep contracts under one stable root directory
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

Add to `~/.zshrc` (default shell since macOS Catalina):

```bash
export DROPBOXSIGN_API_KEY="your_api_key_here"
export DROPBOXSIGN_TEST_MODE="true"
export DROPBOXSIGN_CLIENT_ID="your_client_id_here"
# Optional: set only if you keep contracts under one stable root directory
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

If using Bash on macOS, use `~/.bash_profile` instead.

### Windows

#### Option A — System environment variables (recommended for Claude Desktop)

1. Open **Start** → search **"Edit the system environment variables"**
2. Click **Environment Variables**
3. Under **User variables**, click **New** for each variable
4. Add each `DROPBOXSIGN_*` variable with its value
5. Click **OK** and restart your terminal / MCP client

#### Option B — PowerShell profile (for terminal sessions)

Open PowerShell and run:

```powershell
notepad $PROFILE
```

Add lines like:

```powershell
$env:DROPBOXSIGN_API_KEY = "your_api_key_here"
$env:DROPBOXSIGN_TEST_MODE = "true"
$env:DROPBOXSIGN_CLIENT_ID = "your_client_id_here"
# Optional: set only if you keep contracts under one stable root directory
$env:DROPBOXSIGN_CONTRACTS_DIR = "C:\Users\yourname\contracts"
$env:DROPBOXSIGN_SIGNER_NAME = "Your Name"
$env:DROPBOXSIGN_SIGNER_EMAIL = "you@example.com"
$env:DROPBOXSIGN_SIGNER_ROLE = "Service Provider"
$env:DROPBOXSIGN_BRAND_NAME = "My Company"
$env:DROPBOXSIGN_LOGO_PATH = "C:\Users\yourname\assets\logo.webp"
$env:DROPBOXSIGN_GENERATED_DIR = "C:\Users\yourname\dropboxsign\generated"
$env:DROPBOXSIGN_DOWNLOAD_DIR = "C:\Users\yourname\dropboxsign\downloads"
```

Save and reload:

```powershell
. $PROFILE
```

#### Option C — `.env` file (for any platform)

Copy `.env.example` to `.env` in the repo root and fill in your values.
The server reads `process.env` directly, so any method that sets env vars before launch works.

---

## Setup workflow

### 1. Install dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Build the server

```bash
npm run build
```

Built entrypoint: `dist/src/index.js`

### 3. Register the MCP server

#### OpenCode (`opencode.json`)

```json
{
  "mcpServers": {
    "dropboxsign": {
      "type": "local",
      "command": [
        "node",
        "/absolute/path/to/dropboxsign-mcp/dist/src/index.js"
      ],
      "environment": {
        "DROPBOXSIGN_API_KEY": "{env:DROPBOXSIGN_API_KEY}",
        "DROPBOXSIGN_CLIENT_ID": "{env:DROPBOXSIGN_CLIENT_ID}",
        "DROPBOXSIGN_CONTRACTS_DIR": "{env:DROPBOXSIGN_CONTRACTS_DIR}",
        "DROPBOXSIGN_TEST_MODE": "{env:DROPBOXSIGN_TEST_MODE}",
        "DROPBOXSIGN_SIGNER_NAME": "{env:DROPBOXSIGN_SIGNER_NAME}",
        "DROPBOXSIGN_SIGNER_EMAIL": "{env:DROPBOXSIGN_SIGNER_EMAIL}",
        "DROPBOXSIGN_SIGNER_ROLE": "{env:DROPBOXSIGN_SIGNER_ROLE}",
        "DROPBOXSIGN_BRAND_NAME": "{env:DROPBOXSIGN_BRAND_NAME}",
        "DROPBOXSIGN_LOGO_PATH": "{env:DROPBOXSIGN_LOGO_PATH}",
        "DROPBOXSIGN_GENERATED_DIR": "{env:DROPBOXSIGN_GENERATED_DIR}",
        "DROPBOXSIGN_DOWNLOAD_DIR": "{env:DROPBOXSIGN_DOWNLOAD_DIR}",
        "DROPBOXSIGN_TEMPLATE_DIR": "{env:DROPBOXSIGN_TEMPLATE_DIR}"
      }
    }
  }
}
```

#### Claude Desktop (`claude_desktop_config.json`)

```json
{
  "mcpServers": {
    "dropboxsign": {
      "command": "node",
      "args": ["/absolute/path/to/dropboxsign-mcp/dist/src/index.js"],
      "env": {
        "DROPBOXSIGN_API_KEY": "your_api_key_here",
        "DROPBOXSIGN_CLIENT_ID": "your_client_id_here",
        "DROPBOXSIGN_CONTRACTS_DIR": "/absolute/path/to/contracts",
        "DROPBOXSIGN_TEST_MODE": "true",
        "DROPBOXSIGN_SIGNER_NAME": "Your Name",
        "DROPBOXSIGN_SIGNER_EMAIL": "you@example.com",
        "DROPBOXSIGN_SIGNER_ROLE": "Service Provider",
        "DROPBOXSIGN_BRAND_NAME": "My Company",
        "DROPBOXSIGN_LOGO_PATH": "/absolute/path/to/logo.webp",
        "DROPBOXSIGN_GENERATED_DIR": "/absolute/path/to/generated",
        "DROPBOXSIGN_DOWNLOAD_DIR": "/absolute/path/to/downloads"
      }
    }
  }
}
```

### 4. Restart the MCP client

After changing env vars or MCP config, always restart OpenCode or Claude Desktop.

---

## First-run verification

Run these tools in order:

1. `dropboxsign_auth_status` — confirms API key, client ID, signer preset, and paths
2. `dropboxsign_vault_list_contracts` — lists markdown contracts in your contracts directory
3. `dropboxsign_template_list` — lists existing Dropbox Sign templates
4. `dropboxsign_signature_request_list` — lists existing signature requests

Expected success:

- `apiKeyConfigured: true`
- `clientIdConfigured: true` (if set)
- `signerPreset.email` shows your email (if set)
- `contractsDir` shows your contracts path (if set)

---

## First useful workflow

1. if you have a stable contracts root, find a contract with `dropboxsign_vault_list_contracts`
2. otherwise, skip listing and pass an absolute markdown `sourcePath` directly to `dropboxsign_contract_render_pdf`
3. render it with `dropboxsign_contract_render_pdf`
4. create an embedded template draft with `dropboxsign_template_create_embedded_draft`
5. open the returned `editUrl` in Dropbox Sign to place signature fields
6. send with `dropboxsign_signature_request_send_with_template`
7. download executed files with `dropboxsign_signature_request_download`

---

## Troubleshooting

**MCP server connects but Dropbox Sign tools fail:**
1. run `dropboxsign_auth_status`
2. verify `DROPBOXSIGN_API_KEY` is set in the MCP client environment
3. confirm the built path is `dist/src/index.js`
4. rebuild with `npm run build`
5. restart the MCP client

**PDF rendering fails:**
1. run `npx playwright install chromium`
2. verify `DROPBOXSIGN_LOGO_PATH` exists if branding is enabled
3. inspect generated HTML in `DROPBOXSIGN_GENERATED_DIR`

**Contracts listing returns empty:**
1. verify `DROPBOXSIGN_CONTRACTS_DIR` is set and points to a real directory
2. confirm the directory contains `.md` files
3. if your contracts live in different folders per client, leave `DROPBOXSIGN_CONTRACTS_DIR` unset and use direct `sourcePath` values instead
4. ensure the path is readable by the local process

**Windows path issues:**
- use forward slashes or escaped backslashes in JSON configs: `C:/Users/...` or `C:\\Users\\...`
- prefer System environment variables over PowerShell profile for Claude Desktop

---

## Files to inspect during setup

- `README.md`
- `.env.example`
- `AGENTS.md`
- `templates/default.html`
- `templates/default.css`
- `src/config.ts`
- `src/mcp/server.ts`
