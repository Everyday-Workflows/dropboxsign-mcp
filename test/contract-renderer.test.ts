import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import type { AppConfig } from '../src/config.js';
import { ContractRenderer, getRasterizedCoverPagePrintStyles, renderHtmlDocument } from '../src/contracts/renderer.js';
import { FileSystemService } from '../src/storage/file-system.js';

const templateHtml = '<html><head><style>/*STYLE*/</style><title><!--TITLE--></title></head><body><section><!--COVER_LOGO--><div><!--BRAND_NAME--></div><h1><!--TITLE--></h1><p><!--COVER_SUBTITLE--></p><!--COVER_FACTS--></section><!--SUMMARY--><article><!--BODY--></article></body></html>';

function createTestConfig(templatesDir: string, templatesDirConfigured: boolean): AppConfig {
  return {
    appName: 'contract-pdf-mcp',
    generatedDir: templatesDir,
    templatesDir,
    templatesDirConfigured,
    branding: {
      name: 'Everyday Workflows',
    },
  };
}

test('renderHtmlDocument includes frontmatter metadata and body HTML', () => {
  const source = `---\ntitle: Sample Agreement\nclient: Everyday Workflows\nstatus: draft\n---\n\n# Agreement\n\n> [!warning]\n> Confirm the effective date before sending.\n`;

  const result = renderHtmlDocument(source, templateHtml, 'body { color: black; }', { sourcePath: '/tmp/sample.md', brandName: 'Everyday Workflows' });

  assert.equal(result.title, 'Sample Agreement');
  assert.match(result.html, /Sample Agreement/);
  assert.match(result.html, /Everyday Workflows/);
  assert.match(result.html, /Confirm the effective date before sending/);
});

test('renderHtmlDocument derives title, subtitle, and cover facts from markdown body', () => {
  const source = `# SERVICE AGREEMENT\n## Arrive-GoHighLevel Integration Project\n\n**Client:** Up-current LLC  \n**Service Provider:** Everyday Workflows  \n**Effective Date:** February 2026\n`;

  const result = renderHtmlDocument(source, templateHtml, 'body { color: black; }', { brandName: 'Everyday Workflows' });

  assert.equal(result.title, 'SERVICE AGREEMENT');
  assert.match(result.html, /Arrive-GoHighLevel Integration Project/);
  assert.match(result.html, /Up-current LLC/);
  assert.match(result.html, /Effective Date/);
});

test('renderHtmlDocument humanizes snake_case display text without mutating parsed metadata', () => {
  const source = `---
title: document_type
subtitle: payment_schedule
effective_date: february_2026
service_provider: everyday_workflows
---

# document_type
`;

  const result = renderHtmlDocument(source, templateHtml, 'body { color: black; }', { brandName: 'Everyday Workflows' });

  assert.equal(result.title, 'Document Type');
  assert.equal(result.metadata.title, 'document_type');
  assert.match(result.html, /<title>Document Type<\/title>/);
  assert.match(result.html, /<h1>Document Type<\/h1>/);
  assert.match(result.html, /Payment Schedule/);
  assert.match(result.html, /<th>Effective Date<\/th><td>February 2026<\/td>/);
  assert.match(result.html, /<th>Service Provider<\/th><td>Everyday Workflows<\/td>/);
});

test('validateDefaultTemplateAssets throws a clear error when default template files are missing from an explicit template directory', async () => {
  const templatesDir = await mkdtemp(path.join(os.tmpdir(), 'contract-pdf-templates-'));

  try {
    const config = createTestConfig(templatesDir, true);
    const renderer = new ContractRenderer(config, new FileSystemService(config));

    await assert.rejects(
      renderer.validateDefaultTemplateAssets(),
      /Missing required contract template file\(s\).*default\.html.*default\.css.*CONTRACT_PDF_TEMPLATE_DIR/,
    );
  } finally {
    await rm(templatesDir, { recursive: true, force: true });
  }
});

test('validateDefaultTemplateAssets succeeds when default template files are present', async () => {
  const templatesDir = await mkdtemp(path.join(os.tmpdir(), 'contract-pdf-templates-'));

  try {
    await writeFile(path.join(templatesDir, 'default.html'), '<html><body><!--BODY--></body></html>', 'utf8');
    await writeFile(path.join(templatesDir, 'default.css'), 'body { color: black; }', 'utf8');

    const config = createTestConfig(templatesDir, false);
    const renderer = new ContractRenderer(config, new FileSystemService(config));

    await renderer.validateDefaultTemplateAssets();
  } finally {
    await rm(templatesDir, { recursive: true, force: true });
  }
});

test('bundled print stylesheet uses a PDF-safe cover layout fallback', async () => {
  const stylesheet = await readFile(new URL('../templates/default.css', import.meta.url), 'utf8');

  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-hero\s*\{[\s\S]*?display:\s*flex;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-hero\s*\{[\s\S]*?flex-direction:\s*column;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-hero\s*\{[\s\S]*?justify-content:\s*space-between;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-panel\s*\{[\s\S]*?position:\s*static;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-panel\s*\{[\s\S]*?margin-left:\s*0;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-panel\s*\{[\s\S]*?margin-right:\s*auto;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-panel\s*\{[\s\S]*?backdrop-filter:\s*none;/,
  );
  assert.match(
    stylesheet,
    /@media print\s*\{[\s\S]*?\.cover-panel\s*\{[\s\S]*?-webkit-backdrop-filter:\s*none;/,
  );
});

test('rasterized cover print styles preserve exact page placement', () => {
  const styles = getRasterizedCoverPagePrintStyles();

  assert.match(styles, /\.cover-page\.cover-page-rasterized > \.cover-page-raster\s*\{[\s\S]*?object-fit:\s*fill\s*!important;/);
  assert.match(styles, /\.cover-page\.cover-page-rasterized > \.cover-page-raster\s*\{[\s\S]*?object-position:\s*top left\s*!important;/);
  assert.doesNotMatch(styles, /object-fit:\s*cover\s*!important/);
});
