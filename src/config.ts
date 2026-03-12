import { existsSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const APP_NAME = 'contract-pdf-mcp';
const moduleDirectory = path.dirname(fileURLToPath(import.meta.url));

export interface AppConfig {
  appName: string;
  contractsDir?: string;
  generatedDir: string;
  templatesDir: string;
  templatesDirConfigured: boolean;
  branding: {
    name: string;
    logoPath?: string;
  };
}

function normalizeConfiguredFilesystemPath(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.startsWith('file://')) {
    try {
      return fileURLToPath(trimmedValue);
    } catch {
      return trimmedValue;
    }
  }

  if (!trimmedValue.includes('%')) {
    return trimmedValue;
  }

  return trimmedValue
    .split(/([/\\]+)/)
    .map((segment) => {
      if (segment.length === 0 || /^[\\/]+$/.test(segment)) {
        return segment;
      }

      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    })
    .join('');
}

function resolveContractsDir(): string | undefined {
  const value = process.env.CONTRACT_PDF_CONTRACTS_DIR;
  if (value) {
    return path.resolve(value);
  }

  return undefined;
}

function resolveDefaultLogoPath(): string | undefined {
  if (process.env.CONTRACT_PDF_LOGO_PATH) {
    return path.resolve(normalizeConfiguredFilesystemPath(process.env.CONTRACT_PDF_LOGO_PATH));
  }

  return undefined;
}

function resolveBundledTemplatesDir(): string {
  const candidates = [
    path.resolve(moduleDirectory, '..', 'templates'),
    path.resolve(moduleDirectory, '..', '..', 'templates'),
  ];
  const fallbackCandidate = path.resolve(moduleDirectory, '..', 'templates');

  return candidates.find((candidate) => existsSync(candidate)) ?? fallbackCandidate;
}

function resolveTemplatesDir(): { templatesDir: string; templatesDirConfigured: boolean } {
  const configuredTemplatesDir = process.env.CONTRACT_PDF_TEMPLATE_DIR;

  if (configuredTemplatesDir) {
    return {
      templatesDir: path.resolve(configuredTemplatesDir),
      templatesDirConfigured: true,
    };
  }

  return {
    templatesDir: resolveBundledTemplatesDir(),
    templatesDirConfigured: false,
  };
}

export function getConfig(): AppConfig {
  const homeDirectory = os.homedir();
  const { templatesDir, templatesDirConfigured } = resolveTemplatesDir();

  return {
    appName: APP_NAME,
    contractsDir: resolveContractsDir(),
    generatedDir: path.resolve(
      process.env.CONTRACT_PDF_GENERATED_DIR ?? path.join(homeDirectory, '.local', 'share', APP_NAME, 'generated'),
    ),
    templatesDir,
    templatesDirConfigured,
    branding: {
      name: process.env.CONTRACT_PDF_BRAND_NAME ?? 'My Company',
      logoPath: resolveDefaultLogoPath(),
    },
  };
}
