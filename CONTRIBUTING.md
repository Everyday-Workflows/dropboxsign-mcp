# Contributing

Thanks for contributing to `contract-pdf-mcp`.

## Development setup

```bash
npm install
npx playwright install chromium
```

Recommended local env while developing:

```bash
CONTRACT_PDF_TEMPLATE_DIR=/absolute/path/to/templates
CONTRACT_PDF_GENERATED_DIR=/absolute/path/to/generated
```

You can copy values from [`.env.example`](.env.example) or export them in your shell.

## Typical workflow

1. Create a branch.
2. Make the smallest coherent change.
3. Run the validation commands below.
4. Update docs if the public behavior, tool surface, or env vars changed.
5. Open a PR with a clear summary and testing notes.

## Validation

Run all of these before opening a PR:

```bash
npm run lint
npm run test
npm run build
```

If you changed package metadata or publish behavior, also run:

```bash
npm pack
```

## Contribution guidelines

- Prefer focused PRs over broad refactors.
- Keep new MCP tools aligned with the current local-first design.
- If you add or remove local rendering functionality, update `README.md` so the supported surface stays accurate.
- If you change environment variables or defaults, update both `README.md` and `.env.example`.
- If you add rendered output behavior, include or update tests where practical.

## Secrets and sample data

- Never commit `.env` files, secrets, customer contracts, or rendered documents.
- Use fictional sample data for screenshots, tests, and docs.

## Issues and pull requests

When filing an issue or PR, include:

- what you expected to happen
- what actually happened
- reproduction steps
- relevant MCP client config details if applicable
- logs or screenshots, with secrets removed

## Security

For security issues, please do **not** open a public issue first. Follow [SECURITY.md](SECURITY.md).
