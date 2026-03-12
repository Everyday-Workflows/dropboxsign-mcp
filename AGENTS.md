# Repo Instructions
- This repo is a local contract-to-PDF renderer, not a hosted signing integration.
- When troubleshooting contract styling, treat `contract_pdf_status.templatesDir` as the source of truth for where template files live. For stable custom branding across client launch locations, recommend `CONTRACT_PDF_TEMPLATE_DIR` as an absolute path containing at least `default.html` and `default.css`.
