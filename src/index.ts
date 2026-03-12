import { getConfig } from './config.js';
import { ContractRenderer } from './contracts/renderer.js';
import { startServer } from './mcp/server.js';
import { FileSystemService } from './storage/file-system.js';
import { VaultService } from './vault/vault.js';

async function main(): Promise<void> {
  const config = getConfig();
  const fileSystemService = new FileSystemService(config);
  await fileSystemService.ensureDirectories();

  const contractRenderer = new ContractRenderer(config, fileSystemService);
  await contractRenderer.validateDefaultTemplateAssets();
  const vaultService = new VaultService(config);

  await startServer({
    config,
    contractRenderer,
    vaultService,
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
