# Distribution and submission copy

This file contains ready-to-paste copy for directory submissions and launch posts.

## Positioning

### One-line description

Local-first Dropbox Sign MCP server for rendering markdown contracts, creating template drafts, and sending signature requests from MCP clients.

### Short description

Render markdown contracts to branded PDFs, create Dropbox Sign embedded template drafts, send signature requests, and download signed files from a local MCP workflow.

### Expanded description

`dropboxsign-mcp` is a local-first MCP server for Dropbox Sign. It helps AI clients work with contract files already on disk: discover markdown contracts, render them to branded HTML/PDF, create embedded template drafts, send signature requests, and download completed files locally. The current focus is a practical public-alpha workflow for desktop MCP clients using stdio transport and Dropbox Sign API-key auth.

## Suggested GitHub topics

- `mcp`
- `model-context-protocol`
- `dropbox-sign`
- `hellosign`
- `esignature`
- `contracts`
- `document-automation`
- `legal-tech`
- `typescript`

## Smithery submission draft

### Title

Dropbox Sign MCP Server

### Short description

Local-first Dropbox Sign workflows for MCP clients: render markdown contracts to branded PDFs, create embedded template drafts, send signature requests, and download signed files.

### Long description

Use Dropbox Sign from an MCP client without leaving your local contract workflow. This server can discover markdown contracts on disk, render them to branded HTML/PDF, create embedded template drafts, send signature requests, list and inspect requests, send reminders, update signer details, and download completed files locally. It is designed for desktop MCP clients using stdio transport and Dropbox Sign API-key auth.

### Notes

- local stdio server
- TypeScript implementation
- requires `DROPBOXSIGN_API_KEY`
- supports Dropbox Sign test mode for safe setup and demos
- requires Playwright Chromium for PDF rendering

## Glama listing draft

### Title

Dropbox Sign MCP Server

### Summary

Local-first Dropbox Sign MCP server for markdown contract rendering, embedded template drafts, signature requests, and signed-file downloads.

### Description

`dropboxsign-mcp` is built for contract workflows that already live on your machine. It renders markdown agreements to branded PDFs, creates embedded template drafts in Dropbox Sign, sends and manages signature requests, and saves outputs locally. The current release is aimed at desktop MCP clients using stdio and Dropbox Sign API-key authentication.

### Suggested attributes

- Local
- TypeScript
- Legal / Contracts
- File workflows
- Document automation

## awesome-mcp-servers submission draft

Suggested section: `### ⚖️ Legal`

Suggested entry:

```md
- [Everyday-Workflows/dropboxsign-mcp](https://github.com/Everyday-Workflows/dropboxsign-mcp) 📇 🏠 🍎 🪟 🐧 - Local-first Dropbox Sign MCP server for rendering markdown contracts to branded PDFs, creating embedded template drafts, sending signature requests, and downloading signed files.
```

## Launch checklist

1. Add the suggested GitHub topics.
2. Tag the first release.
3. Run `npm login`.
4. Run `npm whoami`.
5. Run `npm publish --access public`.
6. Submit to Smithery, Glama, and awesome-mcp-servers.
7. Post screenshots from `examples/assets/` in social/community announcements.
