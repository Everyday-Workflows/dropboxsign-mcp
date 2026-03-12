import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getConfig } from '../src/config.js';

test('getConfig uses an explicit template directory when CONTRACT_PDF_TEMPLATE_DIR is set', () => {
  const originalTemplateDir = process.env.CONTRACT_PDF_TEMPLATE_DIR;

  process.env.CONTRACT_PDF_TEMPLATE_DIR = '/tmp/contract-pdf-custom-templates';

  try {
    const config = getConfig();

    assert.equal(config.templatesDir, path.resolve('/tmp/contract-pdf-custom-templates'));
    assert.equal(config.templatesDirConfigured, true);
  } finally {
    if (originalTemplateDir === undefined) {
      delete process.env.CONTRACT_PDF_TEMPLATE_DIR;
    } else {
      process.env.CONTRACT_PDF_TEMPLATE_DIR = originalTemplateDir;
    }
  }
});

test('getConfig falls back to bundled templates when CONTRACT_PDF_TEMPLATE_DIR is unset', () => {
  const originalTemplateDir = process.env.CONTRACT_PDF_TEMPLATE_DIR;

  delete process.env.CONTRACT_PDF_TEMPLATE_DIR;

  try {
    const config = getConfig();

    assert.equal(config.templatesDirConfigured, false);
    assert.equal(path.basename(config.templatesDir), 'templates');
    assert.equal(existsSync(path.join(config.templatesDir, 'default.html')), true);
    assert.equal(existsSync(path.join(config.templatesDir, 'default.css')), true);
  } finally {
    if (originalTemplateDir === undefined) {
      delete process.env.CONTRACT_PDF_TEMPLATE_DIR;
    } else {
      process.env.CONTRACT_PDF_TEMPLATE_DIR = originalTemplateDir;
    }
  }
});

test('getConfig decodes URL-encoded CONTRACT_PDF_LOGO_PATH values', () => {
  const originalLogoPath = process.env.CONTRACT_PDF_LOGO_PATH;

  process.env.CONTRACT_PDF_LOGO_PATH = '/home/alexd/Pictures/EVERYDAY%20WORKFLOWS/webp/horizontallogo.webp';

  try {
    const config = getConfig();

    assert.equal(config.branding.logoPath, path.resolve('/home/alexd/Pictures/EVERYDAY WORKFLOWS/webp/horizontallogo.webp'));
  } finally {
    if (originalLogoPath === undefined) {
      delete process.env.CONTRACT_PDF_LOGO_PATH;
    } else {
      process.env.CONTRACT_PDF_LOGO_PATH = originalLogoPath;
    }
  }
});

test('getConfig converts file URL CONTRACT_PDF_LOGO_PATH values to filesystem paths', () => {
  const originalLogoPath = process.env.CONTRACT_PDF_LOGO_PATH;

  process.env.CONTRACT_PDF_LOGO_PATH = 'file:///tmp/Everyday%20Workflows/logo.webp';

  try {
    const config = getConfig();

    assert.equal(config.branding.logoPath, path.resolve('/tmp/Everyday Workflows/logo.webp'));
  } finally {
    if (originalLogoPath === undefined) {
      delete process.env.CONTRACT_PDF_LOGO_PATH;
    } else {
      process.env.CONTRACT_PDF_LOGO_PATH = originalLogoPath;
    }
  }
});
