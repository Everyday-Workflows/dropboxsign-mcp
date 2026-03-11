import assert from 'node:assert/strict';
import test from 'node:test';

import { createSlug, ensurePathInsideRoots } from '../src/utils/path-security.js';

test('ensurePathInsideRoots accepts a descendant path', () => {
  const result = ensurePathInsideRoots('/tmp/contracts/output.pdf', ['/tmp/contracts']);
  assert.equal(result, '/tmp/contracts/output.pdf');
});

test('ensurePathInsideRoots rejects a path outside the allowed roots', () => {
  assert.throws(() => ensurePathInsideRoots('/tmp/output.pdf', ['/tmp/contracts']));
});

test('createSlug normalizes contract titles', () => {
  assert.equal(createSlug('Camila Montejo Subcontractor Agreement Draft'), 'camila-montejo-subcontractor-agreement-draft');
});
