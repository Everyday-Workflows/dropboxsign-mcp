import os from 'node:os';
import path from 'node:path';



export const APP_NAME = 'dropboxsign-mcp';

export interface AppConfig {
  appName: string;
  vaultPath?: string;
  downloadsDir: string;
  generatedDir: string;
  templatesDir: string;
  branding: {
    name: string;
    logoPath?: string;
  };
  dropboxSign: {
    apiKey?: string;
    clientId?: string;
    testMode: boolean;
  };
  signer: {
    name?: string;
    email?: string;
    role: string;
  };
}

function resolveDefaultVaultPath(): string | undefined {
  if (process.env.DROPBOXSIGN_VAULT_PATH) {
    return path.resolve(process.env.DROPBOXSIGN_VAULT_PATH);
  }

  return undefined;
}

function resolveDefaultLogoPath(): string | undefined {
  if (process.env.DROPBOXSIGN_LOGO_PATH) {
    return path.resolve(process.env.DROPBOXSIGN_LOGO_PATH);
  }

  return undefined;
}

export function getConfig(): AppConfig {
  const homeDirectory = os.homedir();

  return {
    appName: APP_NAME,
    vaultPath: resolveDefaultVaultPath(),
    downloadsDir: path.resolve(
      process.env.DROPBOXSIGN_DOWNLOAD_DIR ?? path.join(homeDirectory, '.local', 'share', APP_NAME, 'downloads'),
    ),
    generatedDir: path.resolve(
      process.env.DROPBOXSIGN_GENERATED_DIR ?? path.join(homeDirectory, '.local', 'share', APP_NAME, 'generated'),
    ),
    templatesDir: path.resolve(process.env.DROPBOXSIGN_TEMPLATE_DIR ?? path.join(process.cwd(), 'templates')),
    branding: {
      name: process.env.DROPBOXSIGN_BRAND_NAME ?? 'My Company',
      logoPath: resolveDefaultLogoPath(),
    },
    dropboxSign: {
      apiKey: process.env.DROPBOXSIGN_API_KEY,
      clientId: process.env.DROPBOXSIGN_CLIENT_ID,
      testMode: process.env.DROPBOXSIGN_TEST_MODE === 'true',
    },
    signer: {
      name: process.env.DROPBOXSIGN_SIGNER_NAME,
      email: process.env.DROPBOXSIGN_SIGNER_EMAIL,
      role: process.env.DROPBOXSIGN_SIGNER_ROLE ?? 'Service Provider',
    },
  };
}
