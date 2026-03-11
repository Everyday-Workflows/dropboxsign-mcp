import { access, readFile } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import { chromium, type Browser } from 'playwright';

import type { AppConfig } from '../config.js';
import { FileSystemService } from '../storage/file-system.js';
import { createSlug } from '../utils/path-security.js';

export interface RenderedContractResult {
  title: string;
  sourcePath: string;
  htmlPath: string;
  pdfPath: string;
  metadata: Record<string, unknown>;
}

export interface RenderOptions {
  templateName?: string;
  outputDirectory?: string;
  outputFileName?: string;
}

function getTemplateAssetPaths(templatesDir: string, templateName: string): { templateHtmlPath: string; templateCssPath: string } {
  return {
    templateHtmlPath: path.join(templatesDir, `${templateName}.html`),
    templateCssPath: path.join(templatesDir, `${templateName}.css`),
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function isSnakeCaseDisplayValue(value: string): boolean {
  return /^[a-z0-9]+(?:_[a-z0-9]+)+$/.test(value.trim());
}

function humanizeSnakeCase(value: string): string {
  return value
    .trim()
    .split('_')
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function formatDisplayText(value: string): string {
  const trimmedValue = value.trim();
  return isSnakeCaseDisplayValue(trimmedValue) ? humanizeSnakeCase(trimmedValue) : trimmedValue;
}

function renderMetadataTable(metadata: Record<string, unknown>): string {
  const ignoredKeys = new Set(['tags', 'status', 'cssclasses']);
  const rows = Object.entries(metadata)
    .filter(([key, value]) => !ignoredKeys.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => {
      const formattedValue = Array.isArray(value)
        ? value.map((item) => (typeof item === 'string' ? formatDisplayText(item) : String(item))).join(', ')
        : typeof value === 'string'
          ? formatDisplayText(value)
          : String(value);
      return `<tr><th>${escapeHtml(humanizeSnakeCase(key))}</th><td>${escapeHtml(formattedValue)}</td></tr>`;
    })
    .join('');

  if (!rows) {
    return '';
  }

  return `<section class="metadata"><h2>Document Details</h2><table>${rows}</table></section>`;
}

function preprocessCallouts(markdown: string): string {
  const lines = markdown.split('\n');
  const rendered: string[] = [];

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index] ?? '';
    const match = line.match(/^>\s*\[!(\w+)\]([+-])?\s*(.*)$/i);

    if (!match) {
      rendered.push(line);
      continue;
    }

    const type = match[1] ?? 'note';
    const customTitle = match[3] ?? '';
    const bodyLines: string[] = [];
    let offset = index + 1;

    while (offset < lines.length) {
      const nextLine = lines[offset] ?? '';
      if (!nextLine.startsWith('>')) {
        break;
      }

      bodyLines.push(nextLine.replace(/^>\s?/, ''));
      offset += 1;
    }

    index = offset - 1;
    const title = customTitle || type;
    rendered.push(`\n<div class="callout callout-${type.toLowerCase()}"><div class="callout-title">${escapeHtml(title)}</div><div class="callout-body">${bodyLines.join('\n')}</div></div>\n`);
  }

  return rendered.join('\n');
}

function createMarkdownRenderer(): MarkdownIt {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
  });
}

function stripMarkdownInline(value: string): string {
  return value
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[*_`~]/g, '')
    .trim();
}

function extractFirstHeading(markdown: string, level: number): string | undefined {
  const pattern = new RegExp(`^#{${level}}\\s+(.+)$`, 'm');
  const match = markdown.match(pattern);
  return match ? stripMarkdownInline(match[1] ?? '') : undefined;
}

function extractLabeledValue(markdown: string, label: string): string | undefined {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`^\\*\\*${escapedLabel}:\\*\\*\\s*(.+?)\\s*$`, 'mi');
  const match = markdown.match(pattern);
  return match ? stripMarkdownInline(match[1] ?? '') : undefined;
}

function extractAgreementEffectiveDate(markdown: string): string | undefined {
  const match = markdown.match(/entered into as of\s+\*\*(.+?)\*\*/i);
  return match ? stripMarkdownInline(match[1] ?? '') : undefined;
}

function renderCoverFacts(markdown: string, metadata: Record<string, unknown>, brandName: string): string {
  const preferredFields = [
    { label: 'Client', value: extractLabeledValue(markdown, 'Client') ?? metadata.client },
    { label: 'Project', value: extractLabeledValue(markdown, 'Project') ?? metadata.project },
    {
      label: 'Effective Date',
      value: extractLabeledValue(markdown, 'Effective Date') ?? metadata.effective_date ?? extractAgreementEffectiveDate(markdown),
    },
    {
      label: 'Service Provider',
      value: extractLabeledValue(markdown, 'Service Provider') ?? metadata.service_provider ?? brandName,
    },
  ];

  const facts = preferredFields
    .filter((fact) => fact.value !== undefined && fact.value !== null && String(fact.value).trim().length > 0)
    .map((fact) => `<div class="cover-fact"><span class="cover-fact-label">${escapeHtml(fact.label)}</span><strong>${escapeHtml(typeof fact.value === 'string' ? formatDisplayText(fact.value) : String(fact.value))}</strong></div>`)
    .join('');

  return facts ? `<div class="cover-facts">${facts}</div>` : '';
}

function renderLogoMarkup(logoDataUri: string | undefined, brandName: string): string {
  if (!logoDataUri) {
    return `<div class="cover-brand-mark">${escapeHtml(brandName)}</div>`;
  }

  return `<img class="cover-logo" src="${logoDataUri}" alt="${escapeHtml(brandName)} logo" />`;
}

interface RenderHtmlOptions {
  sourcePath?: string;
  brandName?: string;
  logoDataUri?: string;
}

export function renderHtmlDocument(markdownSource: string, templateHtml: string, templateCss: string, options: RenderHtmlOptions = {}): { title: string; metadata: Record<string, unknown>; html: string } {
  const parsed = matter(markdownSource);
  const metadata = (parsed.data ?? {}) as Record<string, unknown>;
  const markdownContent = preprocessCallouts(parsed.content);
  const derivedHeadingTitle = extractFirstHeading(parsed.content, 1);
  const derivedSubtitle = typeof metadata.subtitle === 'string' && metadata.subtitle.length > 0
    ? formatDisplayText(metadata.subtitle)
    : typeof metadata.project === 'string' && metadata.project.length > 0
      ? formatDisplayText(metadata.project)
      : formatDisplayText(extractFirstHeading(parsed.content, 2) ?? '');
  const title = typeof metadata.title === 'string' && metadata.title.length > 0
    ? formatDisplayText(metadata.title)
    : derivedHeadingTitle
      ? formatDisplayText(derivedHeadingTitle)
      : options.sourcePath
        ? formatDisplayText(path.basename(options.sourcePath, path.extname(options.sourcePath)))
        : 'Dropbox Sign Contract';
  const brandName = options.brandName ?? 'Everyday Workflows';

  const renderer = createMarkdownRenderer();
  const htmlBody = renderer.render(markdownContent);
  const metadataTable = renderMetadataTable(metadata);
  const coverFacts = renderCoverFacts(parsed.content, metadata, brandName);
  const coverLogo = renderLogoMarkup(options.logoDataUri, brandName);

  const html = templateHtml
    .replaceAll('<!--TITLE-->', escapeHtml(title))
    .replaceAll('/*STYLE*/', templateCss)
    .replaceAll('<!--BRAND_NAME-->', escapeHtml(brandName))
    .replaceAll('<!--COVER_LOGO-->', coverLogo)
    .replaceAll('<!--COVER_SUBTITLE-->', derivedSubtitle ? escapeHtml(derivedSubtitle) : '')
    .replaceAll('<!--COVER_FACTS-->', coverFacts)
    .replaceAll('<!--SUMMARY-->', metadataTable)
    .replaceAll('<!--BODY-->', htmlBody);

  return { title, metadata, html };
}

function getMimeType(filePath: string): string {
  const extension = path.extname(filePath).toLowerCase();

  switch (extension) {
    case '.png':
      return 'image/png';
    case '.jpg':
    case '.jpeg':
      return 'image/jpeg';
    case '.svg':
      return 'image/svg+xml';
    case '.webp':
      return 'image/webp';
    default:
      return 'application/octet-stream';
  }
}

export class ContractRenderer {
  public constructor(
    private readonly config: AppConfig,
    private readonly fileSystemService: FileSystemService,
  ) {}

  private async resolveLogoDataUri(): Promise<string | undefined> {
    if (!this.config.branding.logoPath) {
      return undefined;
    }

    const resolvedLogoPath = this.fileSystemService.resolveReadablePath(this.config.branding.logoPath);
    const contents = await readFile(resolvedLogoPath);
    return `data:${getMimeType(resolvedLogoPath)};base64,${contents.toString('base64')}`;
  }

  private async loadTemplateAssets(templateName: string): Promise<{ templateHtml: string; templateCss: string }> {
    const { templateHtmlPath, templateCssPath } = getTemplateAssetPaths(this.config.templatesDir, templateName);

    try {
      const [templateHtml, templateCss] = await Promise.all([
        readFile(templateHtmlPath, 'utf8'),
        readFile(templateCssPath, 'utf8'),
      ]);

      return { templateHtml, templateCss };
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;
      if (nodeError.code === 'ENOENT') {
        throw new Error(
          `Template "${templateName}" could not be loaded from ${this.config.templatesDir}. Expected files: ${path.basename(templateHtmlPath)} and ${path.basename(templateCssPath)}. ${this.config.templatesDirConfigured ? 'Check DROPBOXSIGN_TEMPLATE_DIR and make sure it points to the directory that contains your contract template files.' : 'Set DROPBOXSIGN_TEMPLATE_DIR to an absolute directory containing your contract template files if you want to override the bundled defaults.'}`,
        );
      }

      throw error;
    }
  }

  public async validateDefaultTemplateAssets(): Promise<void> {
    const { templateHtmlPath, templateCssPath } = getTemplateAssetPaths(this.config.templatesDir, 'default');
    const requiredFiles = [templateHtmlPath, templateCssPath];

    const missingFiles = (await Promise.all(
      requiredFiles.map(async (filePath) => {
        try {
          await access(filePath);
          return undefined;
        } catch {
          return path.basename(filePath);
        }
      }),
    )).filter((fileName): fileName is string => Boolean(fileName));

    if (missingFiles.length === 0) {
      return;
    }

    const recoveryHint = this.config.templatesDirConfigured
      ? 'Check DROPBOXSIGN_TEMPLATE_DIR and make sure it points to a directory that contains at least default.html and default.css.'
      : 'The bundled default templates could not be found. Reinstall the package or set DROPBOXSIGN_TEMPLATE_DIR to an absolute directory that contains at least default.html and default.css.';

    throw new Error(
      `Missing required contract template file(s) in ${this.config.templatesDir}: ${missingFiles.join(', ')}. ${recoveryHint}`,
    );
  }

  public async renderMarkdownFileToPdf(sourcePath: string, options: RenderOptions = {}): Promise<RenderedContractResult> {
    const { templateName = 'default', outputDirectory, outputFileName } = options;
    const resolvedSourcePath = this.fileSystemService.resolveReadablePath(sourcePath);
    const markdown = await readFile(resolvedSourcePath, 'utf8');
    const { templateHtml, templateCss } = await this.loadTemplateAssets(templateName);

    const logoDataUri = await this.resolveLogoDataUri();
    const document = renderHtmlDocument(markdown, templateHtml, templateCss, {
      sourcePath: resolvedSourcePath,
      brandName: this.config.branding.name,
      logoDataUri,
    });

    const baseName = outputFileName
      ? outputFileName.replace(/\.(html|pdf)$/i, '')
      : createSlug(document.title || path.basename(resolvedSourcePath, path.extname(resolvedSourcePath)));

    const resolveTarget = outputDirectory
      ? (name: string) => this.fileSystemService.resolveReadablePath(path.join(outputDirectory, name))
      : (name: string) => this.fileSystemService.resolveGeneratedTarget(name);

    const htmlPath = resolveTarget(`${baseName}.html`);
    const pdfPath = resolveTarget(`${baseName}.pdf`);

    await this.fileSystemService.writeTextFile(htmlPath, document.html);

    let browser: Browser;
    try {
      browser = await chromium.launch({ headless: true });
    } catch (error) {
      throw new Error(
        `Playwright Chromium is required to render PDFs. Install it with \`npx playwright install chromium\`. ${String(error)}`,
      );
    }

    try {
      const page = await browser.newPage();
      await page.setContent(document.html, { waitUntil: 'networkidle' });
      await page.pdf({
        path: pdfPath,
        format: 'Letter',
        printBackground: true,
        preferCSSPageSize: true,
        margin: {
          top: '0',
          right: '0',
          bottom: '0',
          left: '0',
        },
      });
    } finally {
      await browser.close();
    }

    return {
      title: document.title,
      sourcePath: resolvedSourcePath,
      htmlPath,
      pdfPath,
      metadata: document.metadata,
    };
  }

  public async materializeUploadFiles(sourcePaths: string[], templateName = 'default'): Promise<string[]> {
    const outputPaths: string[] = [];

    for (const sourcePath of sourcePaths) {
      const resolvedSourcePath = this.fileSystemService.resolveReadablePath(sourcePath);
      if (path.extname(resolvedSourcePath).toLowerCase() === '.md') {
        const rendered = await this.renderMarkdownFileToPdf(resolvedSourcePath, { templateName });
        outputPaths.push(rendered.pdfPath);
        continue;
      }

      outputPaths.push(resolvedSourcePath);
    }

    return outputPaths;
  }
}
