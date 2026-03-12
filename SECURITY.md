# Security Policy

## Supported versions

Security fixes are targeted at:

- the latest commit on `main`
- the most recent published npm release

Older versions may not receive patches.

## Reporting a vulnerability

Please do **not** report security issues in public GitHub issues.

Use GitHub's private vulnerability reporting flow for this repository if it is enabled. If private reporting is not available, contact the maintainer privately through GitHub and request a non-public reporting channel.

When reporting, include:

- a clear description of the issue
- impact and affected workflow
- reproduction steps or a minimal proof of concept
- any relevant configuration details
- whether real secrets, contracts, or rendered files were involved

## What to avoid posting publicly

Do not include any of the following in public issues, PRs, or screenshots:

- local secrets or API keys from any downstream signing provider
- customer or signer PII
- private contract contents
- rendered or signed document files
- internal filesystem paths you do not want exposed

## Likely high-priority report areas

Examples of issues that are especially relevant for this project:

- arbitrary file read or write outside intended directories
- path traversal or root-escape bugs
- accidental secret exposure in logs or tool responses
- unsafe handling of local document paths
- credential leakage through package or release artifacts

## Disclosure expectations

Please give the maintainer reasonable time to investigate and remediate before public disclosure.
