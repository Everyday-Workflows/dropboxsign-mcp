import { glob } from 'node:fs/promises';
import path from 'node:path';

import type { AppConfig } from '../config.js';

export interface VaultContractRecord {
  absolutePath: string;
  relativePath: string;
  projectName?: string;
  clientName?: string;
}

export class VaultService {
  public constructor(private readonly config: AppConfig) {}

  public isConfigured(): boolean {
    return Boolean(this.config.vaultPath);
  }

  public async listContracts(query?: string, limit = 50): Promise<VaultContractRecord[]> {
    if (!this.config.vaultPath) {
      return [];
    }

    const results: VaultContractRecord[] = [];
    const pattern = path.join(this.config.vaultPath, 'Client-Portal', 'Clients', '*', 'Projects', '*', 'Documents', 'Contracts', '*.md');
    const normalizedQuery = query?.toLowerCase();

    for await (const match of glob(pattern)) {
      const relativePath = path.relative(this.config.vaultPath, match);
      if (normalizedQuery && !relativePath.toLowerCase().includes(normalizedQuery)) {
        continue;
      }

      const segments = relativePath.split(path.sep);
      results.push({
        absolutePath: match,
        relativePath,
        clientName: segments[2],
        projectName: segments[4],
      });

      if (results.length >= limit) {
        break;
      }
    }

    return results.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  }
}
