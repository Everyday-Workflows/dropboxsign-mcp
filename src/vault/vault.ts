import { glob } from 'node:fs/promises';
import path from 'node:path';

import type { AppConfig } from '../config.js';

export interface ContractRecord {
  absolutePath: string;
  relativePath: string;
}

export class VaultService {
  public constructor(private readonly config: AppConfig) {}

  public isConfigured(): boolean {
    return Boolean(this.config.contractsDir);
  }

  public async listContracts(query?: string, limit = 50): Promise<ContractRecord[]> {
    if (!this.config.contractsDir) {
      return [];
    }

    const results: ContractRecord[] = [];
    const pattern = path.join(this.config.contractsDir, '**', '*.md');
    const normalizedQuery = query?.toLowerCase();

    for await (const match of glob(pattern)) {
      const relativePath = path.relative(this.config.contractsDir, match);
      if (normalizedQuery && !relativePath.toLowerCase().includes(normalizedQuery)) {
        continue;
      }

      results.push({ absolutePath: match, relativePath });

      if (results.length >= limit) {
        break;
      }
    }

    return results.sort((left, right) => left.relativePath.localeCompare(right.relativePath));
  }
}
