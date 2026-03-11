import { writeFile } from 'node:fs/promises';
import path from 'node:path';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import type { AppConfig } from '../config.js';
import { ContractRenderer } from '../contracts/renderer.js';
import { DropboxSignClient } from '../dropbox/client.js';
import { FileSystemService } from '../storage/file-system.js';
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
  dropboxSignClient: DropboxSignClient;
  fileSystemService: FileSystemService;
  vaultService: VaultService;
}): Promise<void> {
  const {
    config,
    contractRenderer,
    dropboxSignClient,
    fileSystemService,
    vaultService,
  } = dependencies;

  const server = new McpServer({
    name: 'dropboxsign-mcp-server',
    version: '0.1.0',
  });

  server.registerTool(
    'dropboxsign_auth_status',
    {
      title: 'Dropbox Sign auth status',
      description: 'Shows whether the local Dropbox Sign API key is configured, along with the active local directories and test-mode settings.',
      inputSchema: {},
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async () => {
      const status = {
        authMethod: 'api_key',
        apiKeyConfigured: Boolean(config.dropboxSign.apiKey),
        clientIdConfigured: Boolean(config.dropboxSign.clientId),
        testMode: config.dropboxSign.testMode,
        signerPreset: {
          name: config.signer.name ?? '(not set)',
          email: config.signer.email ?? '(not set)',
          role: config.signer.role,
        },
        vaultPath: config.vaultPath ?? '(not set)',
        downloadsDir: config.downloadsDir,
        generatedDir: config.generatedDir,
        templatesDir: config.templatesDir,
        brandName: config.branding.name,
        logoConfigured: Boolean(config.branding.logoPath),
      };

      return textResult(JSON.stringify(status, null, 2), status);
    },
  );

  server.registerTool(
    'dropboxsign_verify_account',
    {
      title: 'Verify Dropbox Sign account',
      description: 'Checks whether a Dropbox Sign account exists for the supplied email address.',
      inputSchema: {
        emailAddress: z.string().email().describe('Email address to verify in Dropbox Sign.'),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ emailAddress }) => {
      const result = await dropboxSignClient.verifyAccount(emailAddress);
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_vault_list_contracts',
    {
      title: 'List vault contracts',
      description: 'Lists contract markdown files discovered in the configured Obsidian vault.',
      inputSchema: {
        query: z.string().optional().describe('Optional case-insensitive filter applied to the vault contract path.'),
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
    'dropboxsign_contract_render_pdf',
    {
      title: 'Render markdown contract to PDF',
      description: 'Renders a local markdown contract (including Obsidian vault notes) to branded HTML and PDF for Dropbox Sign upload.',
      inputSchema: z.object({
        sourcePath: z.string().describe('Absolute or allowed local path to a markdown contract file.'),
        templateName: z.string().default('default').describe('Brand template basename in the templates directory, without the .html/.css extension.'),
        outputDirectory: z.string().optional().describe('Optional absolute directory to save the rendered HTML and PDF. Defaults to DROPBOXSIGN_GENERATED_DIR.'),
        outputFileName: z.string().optional().describe('Optional base filename (without extension) for the rendered files.'),
      }),
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
    },
    async ({ sourcePath, templateName, outputDirectory, outputFileName }) => {
      const rendered = await contractRenderer.renderMarkdownFileToPdf(sourcePath, { templateName, outputDirectory, outputFileName });
      return textResult(JSON.stringify(rendered, null, 2), rendered as unknown as Record<string, unknown>);
    },
  );

  server.registerTool(
    'dropboxsign_template_list',
    {
      title: 'List Dropbox Sign templates',
      description: 'Lists Dropbox Sign templates available to the authenticated user.',
      inputSchema: {
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        query: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ page, pageSize, query }) => {
      const result = await dropboxSignClient.listTemplates(page, pageSize, query);
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_template_get',
    {
      title: 'Get Dropbox Sign template',
      description: 'Fetches a specific Dropbox Sign template by template ID.',
      inputSchema: {
        templateId: z.string().min(1),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ templateId }) => {
      const result = await dropboxSignClient.getTemplate(templateId);
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_template_create_embedded_draft',
    {
      title: 'Create embedded template draft',
      description: 'Uploads local PDF or markdown contract files and returns a Dropbox Sign embedded template edit URL so you can place fields visually and preserve branding.',
      inputSchema: {
        filePaths: z.array(z.string()).min(1).describe('Local PDF or markdown paths. Markdown files are auto-rendered to PDF before upload.'),
        title: z.string().min(1),
        subject: z.string().optional(),
        message: z.string().optional(),
        templateName: z.string().default('default').describe('Brand template name used when markdown sources are converted to PDF.'),
        signerRoles: z.array(z.object({ name: z.string(), order: z.number().int().min(0) })).min(1),
        ccRoles: z.array(z.string()).optional(),
        mergeFields: z.array(z.object({ name: z.string(), type: z.enum(['text', 'checkbox']) })).optional(),
        clientId: z.string().optional().describe('Optional Dropbox Sign API app client_id used for branding. Defaults to DROPBOXSIGN_CLIENT_ID if set.'),
        testMode: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ filePaths, title, subject, message, templateName, signerRoles, ccRoles, mergeFields, clientId, testMode }) => {
      const preparedFiles = await contractRenderer.materializeUploadFiles(filePaths, templateName);
      const result = await dropboxSignClient.createEmbeddedTemplateDraft({
        filePaths: preparedFiles,
        title,
        subject,
        message,
        signerRoles,
        ccRoles,
        mergeFields,
        clientId,
        testMode,
      });
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_send',
    {
      title: 'Send signature request',
      description: 'Sends a Dropbox Sign signature request from local PDF/markdown files or remote file URLs.',
      inputSchema: {
        filePaths: z.array(z.string()).optional().describe('Local PDF or markdown paths. Markdown files are auto-rendered to PDF before upload.'),
        fileUrls: z.array(z.string().url()).optional().describe('Remote URLs Dropbox Sign should fetch directly.'),
        templateName: z.string().default('default'),
        signers: z.array(z.object({ name: z.string(), emailAddress: z.string().email(), order: z.number().int().min(0).optional() })).min(1),
        ccEmailAddresses: z.array(z.string().email()).optional(),
        message: z.string().optional(),
        subject: z.string().optional(),
        title: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        clientId: z.string().optional(),
        testMode: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ filePaths, fileUrls, templateName, signers, ccEmailAddresses, message, subject, title, metadata, clientId, testMode }) => {
      if ((!filePaths || filePaths.length === 0) && (!fileUrls || fileUrls.length === 0)) {
        throw new Error('Provide at least one local file path or file URL.');
      }

      const preparedFiles = filePaths ? await contractRenderer.materializeUploadFiles(filePaths, templateName) : undefined;
      const result = await dropboxSignClient.sendSignatureRequest({
        filePaths: preparedFiles,
        fileUrls,
        signers,
        ccEmailAddresses,
        message,
        subject,
        title,
        metadata,
        clientId,
        testMode,
      });

      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_send_with_template',
    {
      title: 'Send signature request with template',
      description: 'Sends a Dropbox Sign signature request using one or more existing Dropbox Sign templates.',
      inputSchema: {
        templateIds: z.array(z.string()).min(1),
        signers: z.array(z.object({ role: z.string(), name: z.string(), emailAddress: z.string().email() })).min(1),
        ccs: z.array(z.object({ role: z.string(), emailAddress: z.string().email() })).optional(),
        customFields: z.array(z.object({ name: z.string(), value: z.string(), editor: z.string().optional(), required: z.boolean().optional() })).optional(),
        filePaths: z.array(z.string()).optional(),
        fileUrls: z.array(z.string().url()).optional(),
        templateName: z.string().default('default'),
        message: z.string().optional(),
        subject: z.string().optional(),
        title: z.string().optional(),
        metadata: z.record(z.any()).optional(),
        clientId: z.string().optional(),
        testMode: z.boolean().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ templateIds, signers, ccs, customFields, filePaths, fileUrls, templateName, message, subject, title, metadata, clientId, testMode }) => {
      const preparedFiles = filePaths ? await contractRenderer.materializeUploadFiles(filePaths, templateName) : undefined;
      const result = await dropboxSignClient.sendSignatureRequestWithTemplate({
        templateIds,
        signers,
        ccs,
        customFields,
        filePaths: preparedFiles,
        fileUrls,
        message,
        subject,
        title,
        metadata,
        clientId,
        testMode,
      });
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_list',
    {
      title: 'List signature requests',
      description: 'Lists Dropbox Sign signature requests for the authenticated user.',
      inputSchema: {
        page: z.number().int().min(1).default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        query: z.string().optional(),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ page, pageSize, query }) => {
      const result = await dropboxSignClient.listSignatureRequests(page, pageSize, query);
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_get',
    {
      title: 'Get signature request',
      description: 'Fetches one Dropbox Sign signature request by ID.',
      inputSchema: {
        signatureRequestId: z.string().min(1),
      },
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ signatureRequestId }) => {
      const result = await dropboxSignClient.getSignatureRequest(signatureRequestId);
      return textResult(JSON.stringify(result, null, 2), result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_download',
    {
      title: 'Download signature request files',
      description: 'Downloads completed or current signature request files to local storage.',
      inputSchema: {
        signatureRequestId: z.string().min(1),
        fileType: z.enum(['pdf', 'zip']).default('pdf'),
        outputFileName: z.string().optional().describe('Optional filename within the configured downloads directory.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ signatureRequestId, fileType, outputFileName }) => {
      const buffer = await dropboxSignClient.downloadSignatureRequest(signatureRequestId, fileType);
      const fileName = outputFileName ?? `${signatureRequestId}.${fileType}`;
      const targetPath = fileSystemService.resolveDownloadTarget(fileName);
      await writeFile(targetPath, buffer);
      return textResult(`Saved signature request files to ${targetPath}.`, { targetPath, size: buffer.byteLength });
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_cancel',
    {
      title: 'Cancel signature request',
      description: 'Cancels an in-progress Dropbox Sign signature request. Cannot be undone.',
      inputSchema: {
        signatureRequestId: z.string().min(1).describe('ID of the signature request to cancel.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: true, idempotentHint: false, openWorldHint: true },
    },
    async ({ signatureRequestId }) => {
      await dropboxSignClient.cancelSignatureRequest(signatureRequestId);
      return textResult(`Signature request ${signatureRequestId} has been cancelled.`, { signatureRequestId, cancelled: true });
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_remind',
    {
      title: 'Send reminder for signature request',
      description: 'Sends a reminder email to a signer who has not yet signed.',
      inputSchema: {
        signatureRequestId: z.string().min(1),
        emailAddress: z.string().email().describe('Email address of the signer to remind.'),
        name: z.string().optional().describe('Name of the signer to remind.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ signatureRequestId, emailAddress, name }) => {
      const result = await dropboxSignClient.sendReminder(signatureRequestId, emailAddress, name);
      return textResult(`Reminder sent to ${emailAddress}.`, result);
    },
  );

  server.registerTool(
    'dropboxsign_signature_request_update_signer',
    {
      title: 'Update signer email',
      description: 'Updates the email address (and optionally name) of a signer on an in-progress signature request.',
      inputSchema: {
        signatureRequestId: z.string().min(1),
        signerId: z.string().min(1).describe('The signature ID of the signer to update. Found in the signature request details.'),
        emailAddress: z.string().email().describe('New email address for the signer.'),
        name: z.string().optional().describe('New name for the signer.'),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
    },
    async ({ signatureRequestId, signerId, emailAddress, name }) => {
      const result = await dropboxSignClient.updateSignerEmail(signatureRequestId, signerId, emailAddress, name);
      return textResult(`Signer ${signerId} updated to ${emailAddress}.`, result);
    },
  );

  server.registerTool(
    'dropboxsign_template_download',
    {
      title: 'Download template files',
      description: 'Downloads Dropbox Sign template files to local storage.',
      inputSchema: {
        templateId: z.string().min(1),
        fileType: z.enum(['pdf', 'zip']).default('pdf'),
        outputFileName: z.string().optional(),
      },
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
    },
    async ({ templateId, fileType, outputFileName }) => {
      const buffer = await dropboxSignClient.downloadTemplate(templateId, fileType);
      const fileName = outputFileName ?? `${templateId}.${fileType}`;
      const targetPath = fileSystemService.resolveDownloadTarget(fileName);
      await writeFile(targetPath, buffer);
      return textResult(`Saved template files to ${targetPath}.`, { targetPath, size: buffer.byteLength });
    },
  );

  const transport = new StdioServerTransport();
  await server.connect(transport);
}
