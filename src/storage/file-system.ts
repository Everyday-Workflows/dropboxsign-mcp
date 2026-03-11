import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import type { AppConfig } from '../config.js';
import { ensurePathInsideRoots } from '../utils/path-security.js';

export class FileSystemService {
  public constructor(private readonly config: AppConfig) {}

  public async ensureDirectories(): Promise<void> {
    await Promise.all([
      mkdir(this.config.downloadsDir, { recursive: true }),
      mkdir(this.config.generatedDir, { recursive: true }),
      mkdir(this.config.templatesDir, { recursive: true }),
    ]);
  }

  public resolveReadablePath(inputPath: string): string {
    const allowedRoots = [process.cwd(), this.config.generatedDir, this.config.downloadsDir];
    if (this.config.contractsDir) {
      allowedRoots.push(this.config.contractsDir);
    }
    if (this.config.branding.logoPath) {
      allowedRoots.push(path.dirname(this.config.branding.logoPath));
    }

    return ensurePathInsideRoots(inputPath, allowedRoots);
  }

  public resolveDownloadTarget(fileName: string): string {
    return ensurePathInsideRoots(path.join(this.config.downloadsDir, fileName), [this.config.downloadsDir]);
  }

  public resolveGeneratedTarget(fileName: string): string {
    return ensurePathInsideRoots(path.join(this.config.generatedDir, fileName), [this.config.generatedDir]);
  }

  public async writeTextFile(targetPath: string, contents: string): Promise<void> {
    await mkdir(path.dirname(targetPath), { recursive: true });
    await writeFile(targetPath, contents, 'utf8');
  }
}
