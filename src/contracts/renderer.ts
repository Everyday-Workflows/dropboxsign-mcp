import { readFile } from 'node:fs/promises';
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

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function renderMetadataTable(metadata: Record<string, unknown>): string {
  const ignoredKeys = new Set(['tags', 'status', 'cssclasses']);
  const rows = Object.entries(metadata)
    .filter(([key, value]) => !ignoredKeys.has(key) && value !== null && value !== undefined)
    .map(([key, value]) => {
      const formattedValue = Array.isArray(value) ? value.join(', ') : String(value);
      return `<tr><th>${escapeHtml(key)}</th><td>${escapeHtml(formattedValue)}</td></tr>`;
    })
    .join('');

  if (!rows) {
    return '';
  }

  return `<section class="metadata"><h2>Document Details</h2><table>${rows}</table></section>`;
}

function preprocessObsidianCallouts(markdown: string): string {
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

function renderCoverFacts(markdown: string, metadata: Record<string, unknown>): string {
  const preferredFields = [
    { label: 'Client', value: extractLabeledValue(markdown, 'Client') ?? metadata.client },
    { label: 'Project', value: extractLabeledValue(markdown, 'Project') ?? metadata.project },
    { label: 'Effective Date', value: extractLabeledValue(markdown, 'Effective Date') ?? metadata.effective_date },
    { label: 'Service Provider', value: extractLabeledValue(markdown, 'Service Provider') ?? metadata.service_provider },
  ];

  const facts = preferredFields
    .filter((fact) => fact.value !== undefined && fact.value !== null && String(fact.value).trim().length > 0)
    .map((fact) => `<div class="cover-fact"><span class="cover-fact-label">${escapeHtml(fact.label)}</span><strong>${escapeHtml(String(fact.value))}</strong></div>`)
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
  const markdownContent = preprocessObsidianCallouts(parsed.content);
  const derivedHeadingTitle = extractFirstHeading(parsed.content, 1);
  const derivedSubtitle = typeof metadata.subtitle === 'string' && metadata.subtitle.length > 0
    ? metadata.subtitle
    : typeof metadata.project === 'string' && metadata.project.length > 0
      ? metadata.project
      : extractFirstHeading(parsed.content, 2);
  const title = typeof metadata.title === 'string' && metadata.title.length > 0
    ? metadata.title
    : derivedHeadingTitle
      ? derivedHeadingTitle
      : options.sourcePath
        ? path.basename(options.sourcePath, path.extname(options.sourcePath))
      : 'Dropbox Sign Contract';
  const brandName = options.brandName ?? 'Everyday Workflows';

  const renderer = createMarkdownRenderer();
  const htmlBody = renderer.render(markdownContent);
  const metadataTable = renderMetadataTable(metadata);
  const coverFacts = renderCoverFacts(parsed.content, metadata);
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

  public async renderMarkdownFileToPdf(sourcePath: string, options: RenderOptions = {}): Promise<RenderedContractResult> {
    const { templateName = 'default', outputDirectory, outputFileName } = options;
    const resolvedSourcePath = this.fileSystemService.resolveReadablePath(sourcePath);
    const markdown = await readFile(resolvedSourcePath, 'utf8');
    const templateHtmlPath = path.join(this.config.templatesDir, `${templateName}.html`);
    const templateCssPath = path.join(this.config.templatesDir, `${templateName}.css`);
    const [templateHtml, templateCss] = await Promise.all([
      readFile(templateHtmlPath, 'utf8'),
      readFile(templateCssPath, 'utf8'),
    ]);

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
        margin: {
          top: '0.6in',
          right: '0.6in',
          bottom: '0.75in',
          left: '0.6in',
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
