#!/usr/bin/env node

import('../dist/src/index.js').catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
