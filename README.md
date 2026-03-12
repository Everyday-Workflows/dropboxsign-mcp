# Contract PDF MCP Server

Local-first MCP server for rendering markdown contracts to branded HTML and PDF using reusable local templates. No hosted signing provider is required.

## Features

- local stdio transport for MCP desktop clients
- markdown-to-branded HTML/PDF rendering with a dedicated cover page
- local template discovery from a reusable HTML/CSS template directory
- local contracts directory discovery, plus direct absolute-path support when no fixed contracts root is set
- local output directory for rendered documents

## Install

### From source

```bash
git clone https://github.com/Everyday-Workflows/dropboxsign-mcp.git
cd dropboxsign-mcp
npm install
npx playwright install chromium
npm run build
```

## Configuration

Copy `.env.example` to `.env` or export the same variables in your shell.

Commonly used values:

```bash
CONTRACT_PDF_CONTRACTS_DIR=/absolute/path/to/contracts
CONTRACT_PDF_BRAND_NAME=My Company
CONTRACT_PDF_LOGO_PATH=/absolute/path/to/logo.webp
CONTRACT_PDF_GENERATED_DIR=/absolute/path/to/generated
CONTRACT_PDF_TEMPLATE_DIR=/absolute/path/to/templates
```

If your contracts live in different client folders each time, you can leave `CONTRACT_PDF_CONTRACTS_DIR` unset and pass absolute file paths directly to the render tool.

`CONTRACT_PDF_TEMPLATE_DIR` should point to an absolute directory containing at least `default.html` and `default.css`. If you leave it unset, the server falls back to the bundled templates shipped with this repo and `contract_pdf_status` will report `templatesDirSource: "bundled_default"`.

For the full annotated variable list, see [`.env.example`](.env.example).

## Quick start

1. Install dependencies and Chromium for Playwright.
2. Set `CONTRACT_PDF_TEMPLATE_DIR` if you want a stable custom contract style.
3. Add the MCP server to your client config.
4. Run `contract_pdf_status` to confirm config, directories, and the resolved `templatesDir`.
5. Render a markdown contract to PDF.

## MCP client config

### Running from source

```json
{
  "mcpServers": {
    "contract-pdf": {
      "command": "node",
      "args": ["/absolute/path/to/dropboxsign-mcp/dist/src/index.js"],
      "env": {
        "CONTRACT_PDF_TEMPLATE_DIR": "/absolute/path/to/templates",
        "CONTRACT_PDF_BRAND_NAME": "My Company",
        "CONTRACT_PDF_GENERATED_DIR": "/absolute/path/to/generated"
      }
    }
  }
}
```

## Example tool inputs

If you do **not** set `CONTRACT_PDF_CONTRACTS_DIR`, you can still work directly from absolute file paths.

Example prompts:

```text
Render /absolute/path/to/contract.md to PDF
List available local templates
List contracts in my configured contracts directory
```

Example tool input for `contract_render_pdf`:

```json
{
  "sourcePath": "/absolute/path/to/contract.md",
  "templateName": "default"
}
```

## Implemented tools

- `contract_pdf_status`
- `contract_template_list`
- `contract_list`
- `contract_render_pdf`

## Contract workflow

1. If you configured `CONTRACT_PDF_CONTRACTS_DIR`, find a contract with `contract_list`.
2. Otherwise, pass the absolute contract path directly to `contract_render_pdf`.
3. Render markdown to HTML/PDF with `contract_render_pdf`.
4. Upload the PDF manually to your signing provider of choice when needed.

The default template renders a dedicated branded cover page on page 1 and starts the contract body on page 2.

The server validates that the resolved template directory contains `default.html` and `default.css` during startup so template-path mistakes fail fast instead of surfacing later during rendering.

## Why this design

- **Transport:** stdio is the right fit for local MCP servers used in desktop clients.
- **Portability:** contracts stay as plain markdown on your filesystem until you intentionally render them.
- **Branding:** templates and logo assets stay local and fully under your control.
- **Simplicity:** PDF generation is decoupled from any signing vendor or API pricing model.

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

## License

[MIT](LICENSE)
