import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';

import { getConfig } from '../src/config.js';

test('getConfig uses an explicit template directory when DROPBOXSIGN_TEMPLATE_DIR is set', () => {
  const originalTemplateDir = process.env.DROPBOXSIGN_TEMPLATE_DIR;

  process.env.DROPBOXSIGN_TEMPLATE_DIR = '/tmp/dropboxsign-custom-templates';

  try {
    const config = getConfig();

    assert.equal(config.templatesDir, path.resolve('/tmp/dropboxsign-custom-templates'));
    assert.equal(config.templatesDirConfigured, true);
  } finally {
    if (originalTemplateDir === undefined) {
      delete process.env.DROPBOXSIGN_TEMPLATE_DIR;
    } else {
      process.env.DROPBOXSIGN_TEMPLATE_DIR = originalTemplateDir;
    }
  }
});

test('getConfig falls back to bundled templates when DROPBOXSIGN_TEMPLATE_DIR is unset', () => {
  const originalTemplateDir = process.env.DROPBOXSIGN_TEMPLATE_DIR;

  delete process.env.DROPBOXSIGN_TEMPLATE_DIR;

  try {
    const config = getConfig();

    assert.equal(config.templatesDirConfigured, false);
    assert.equal(path.basename(config.templatesDir), 'templates');
    assert.equal(existsSync(path.join(config.templatesDir, 'default.html')), true);
    assert.equal(existsSync(path.join(config.templatesDir, 'default.css')), true);
  } finally {
    if (originalTemplateDir === undefined) {
      delete process.env.DROPBOXSIGN_TEMPLATE_DIR;
    } else {
      process.env.DROPBOXSIGN_TEMPLATE_DIR = originalTemplateDir;
    }
  }
});
