import path from 'node:path';

export function normalizePath(value: string): string {
  return path.resolve(value);
}

export function ensurePathInsideRoots(inputPath: string, roots: string[]): string {
  const resolvedPath = normalizePath(inputPath);
  const normalizedRoots = roots.map((root) => normalizePath(root));

  const isAllowed = normalizedRoots.some((root) => {
    const relativePath = path.relative(root, resolvedPath);
    return relativePath === '' || (!relativePath.startsWith('..') && !path.isAbsolute(relativePath));
  });

  if (!isAllowed) {
    throw new Error(`Path is outside the allowed roots: ${inputPath}`);
  }

  return resolvedPath;
}

export function createSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}
