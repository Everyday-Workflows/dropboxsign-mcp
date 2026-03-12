import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import type { AppConfig } from '../config.js';
import { ContractRenderer } from '../contracts/renderer.js';
import { VaultService } from '../vault/vault.js';

function normalizeStructuredContent(value: unknown): Record<string, unknown> | undefined {
  if (value === undefined) {
    return undefined;
  }

  const normalized = JSON.parse(JSON.stringify(value)) as unknown;

  if (normalized !== null && typeof normalized === 'object' && !Array.isArray(normalized)) {
    return normalized as Record<string, unknown>;
  }

  return { result: normalized as string | number | boolean | null | unknown[] };
}

function textResult(text: string, structuredContent?: unknown) {
  return {
    content: [{ type: 'text' as const, text }],
    structuredContent: normalizeStructuredContent(structuredContent),
  };
}

export async function startServer(dependencies: {
  config: AppConfig;
  contractRenderer: ContractRenderer;
  vaultService: VaultService;
}): Promise<void> {
  const { config, contractRenderer, vaultService } = dependencies;

  const server = new McpServer({
    name: 'contract-pdf-mcp-server',
    version: '0.2.0',
  });

  server.registerTool(
    'contract_pdf_status',
    {
      title: 'Contract PDF status',
      description: 'Shows the local contract, template, branding, and output directory configuration.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const templates = await contractRenderer.listTemplates();
      const status = {
        contractsDir: config.contractsDir ?? '(not set)',
        generatedDir: config.generatedDir,
        templatesDir: config.templatesDir,
        templatesDirSource: config.templatesDirConfigured ? 'env' : 'bundled_default',
        brandName: config.branding.name,
        logoConfigured: Boolean(config.branding.logoPath),
        availableTemplates: templates.map((template) => template.name),
      };

      return textResult(JSON.stringify(status, null, 2), status);
    },
  );

  server.registerTool(
    'contract_template_list',
    {
      title: 'List local templates',
      description: 'Lists local HTML/CSS contract templates discovered in the configured templates directory.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const templates = await contractRenderer.listTemplates();
      return textResult(JSON.stringify({ templates }, null, 2), { templates });
    },
  );

  server.registerTool(
    'contract_list',
    {
      title: 'List contracts',
      description: 'Lists markdown contract files discovered in the configured contracts directory.',
      inputSchema: {
        query: z.string().optional().describe('Optional case-insensitive filter applied to the contract path.'),
        limit: z.number().int().min(1).max(100).default(25).describe('Maximum number of results to return.'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ query, limit }) => {
      const contracts = await vaultService.listContracts(query, limit);
      return textResult(JSON.stringify(contracts, null, 2), { contracts });
    },
  );

  server.registerTool(
    'contract_render_pdf',
    {
      title: 'Render markdown contract to PDF',
      description: 'Renders a local markdown contract to branded HTML and PDF.',
      inputSchema: z.object({
        sourcePath: z.string().describe('Absolute or allowed local path to a markdown contract file.'),
        templateName: z.string().default('default').describe('Template basename in the templates directory, without the .html/.css extension.'),
        outputDirectory: z.string().optional().describe('Optional absolute directory to save the rendered HTML and PDF. Defaults to CONTRACT_PDF_GENERATED_DIR.'),
        outputFileName: z.string().optional().describe('Optional base filename (without extension) for the rendered files.'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ sourcePath, templateName, outputDirectory, outputFileName }) => {
      const rendered = await contractRenderer.renderMarkdownFileToPdf(sourcePath, { templateName, outputDirectory, outputFileName });
      return textResult(JSON.stringify(rendered, null, 2), rendered as unknown as Record<string, unknown>);
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
