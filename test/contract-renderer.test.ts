import assert from 'node:assert/strict';
import test from 'node:test';

import { renderHtmlDocument } from '../src/contracts/renderer.js';

const templateHtml = '<html><head><style>/*STYLE*/</style><title><!--TITLE--></title></head><body><section><!--COVER_LOGO--><div><!--BRAND_NAME--></div><h1><!--TITLE--></h1><p><!--COVER_SUBTITLE--></p><!--COVER_FACTS--></section><!--SUMMARY--><article><!--BODY--></article></body></html>';

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
