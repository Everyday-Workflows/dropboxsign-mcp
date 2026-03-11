import { createReadStream } from 'node:fs';

import * as DropboxSign from '@dropbox/sign';

import type { AppConfig } from '../config.js';

export interface SendSigner {
  name: string;
  emailAddress: string;
  order?: number;
  role?: string;
}

export interface SendCc {
  role?: string;
  emailAddress: string;
}

export interface MergeField {
  name: string;
  type: 'text' | 'checkbox';
}

export interface TemplateRole {
  name: string;
  order: number;
}

export class DropboxSignClient {
  public constructor(private readonly config: AppConfig) {}

  private withApiClient<T extends { username?: string; accessToken?: string | (() => string) }>(Factory: new (basePath?: string) => T): T {
    if (!this.config.dropboxSign.apiKey) {
      throw new Error('DROPBOXSIGN_API_KEY is required. Export it before starting the MCP server.');
    }

    const api = new Factory();
    api.username = this.config.dropboxSign.apiKey;
    return api;
  }

  public async verifyAccount(emailAddress: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.AccountApi);
    const response = await (api as any).accountVerify({ emailAddress });
    return response.body;
  }

  public async listTemplates(page = 1, pageSize = 20, query?: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.TemplateApi);
    const response = await (api as any).templateList(undefined, page, pageSize, query);
    return response.body;
  }

  public async getTemplate(templateId: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.TemplateApi);
    const response = await (api as any).templateGet(templateId);
    return response.body;
  }

  public async createEmbeddedTemplateDraft(input: {
    filePaths: string[];
    signerRoles: TemplateRole[];
    ccRoles?: string[];
    mergeFields?: MergeField[];
    title: string;
    subject?: string;
    message?: string;
    clientId?: string;
    testMode?: boolean;
  }): Promise<any> {
    const api = this.withApiClient(DropboxSign.TemplateApi);
    const response = await (api as any).templateCreateEmbeddedDraft({
      clientId: input.clientId ?? this.config.dropboxSign.clientId,
      files: input.filePaths.map((filePath) => createReadStream(filePath)),
      signerRoles: input.signerRoles,
      ccRoles: input.ccRoles,
      mergeFields: input.mergeFields,
      title: input.title,
      subject: input.subject,
      message: input.message,
      testMode: input.testMode ?? this.config.dropboxSign.testMode,
    });

    return response.body;
  }

  public async sendSignatureRequest(input: {
    filePaths?: string[];
    fileUrls?: string[];
    signers: SendSigner[];
    ccEmailAddresses?: string[];
    message?: string;
    subject?: string;
    title?: string;
    metadata?: Record<string, unknown>;
    clientId?: string;
    testMode?: boolean;
  }): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestSend({
      files: input.filePaths?.map((filePath) => createReadStream(filePath)),
      fileUrls: input.fileUrls,
      signers: input.signers,
      ccEmailAddresses: input.ccEmailAddresses,
      message: input.message,
      subject: input.subject,
      title: input.title,
      metadata: input.metadata,
      clientId: input.clientId ?? this.config.dropboxSign.clientId,
      testMode: input.testMode ?? this.config.dropboxSign.testMode,
    });

    return response.body;
  }

  public async sendSignatureRequestWithTemplate(input: {
    templateIds: string[];
    signers: SendSigner[];
    ccs?: SendCc[];
    customFields?: Array<{ name: string; value: string; editor?: string; required?: boolean }>;
    filePaths?: string[];
    fileUrls?: string[];
    message?: string;
    subject?: string;
    title?: string;
    metadata?: Record<string, unknown>;
    clientId?: string;
    testMode?: boolean;
  }): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestSendWithTemplate({
      templateIds: input.templateIds,
      signers: input.signers,
      ccs: input.ccs,
      customFields: input.customFields,
      files: input.filePaths?.map((filePath) => createReadStream(filePath)),
      fileUrls: input.fileUrls,
      message: input.message,
      subject: input.subject,
      title: input.title,
      metadata: input.metadata,
      clientId: input.clientId ?? this.config.dropboxSign.clientId,
      testMode: input.testMode ?? this.config.dropboxSign.testMode,
    });

    return response.body;
  }

  public async listSignatureRequests(page = 1, pageSize = 20, query?: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestList(undefined, page, pageSize, query);
    return response.body;
  }

  public async getSignatureRequest(signatureRequestId: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestGet(signatureRequestId);
    return response.body;
  }

  public async downloadSignatureRequest(signatureRequestId: string, fileType: 'pdf' | 'zip'): Promise<Buffer> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestFiles(signatureRequestId, fileType);
    return response.body as Buffer;
  }

  public async downloadTemplate(templateId: string, fileType: 'pdf' | 'zip'): Promise<Buffer> {
    const api = this.withApiClient(DropboxSign.TemplateApi);
    const response = await (api as any).templateFiles(templateId, fileType);
    return response.body as Buffer;
  }

  public async cancelSignatureRequest(signatureRequestId: string): Promise<void> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    await (api as any).signatureRequestCancel(signatureRequestId);
  }

  public async sendReminder(signatureRequestId: string, emailAddress: string, name?: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestRemind(signatureRequestId, {
      emailAddress,
      name,
    });
    return response.body;
  }

  public async updateSignerEmail(signatureRequestId: string, signerId: string, emailAddress: string, name?: string): Promise<any> {
    const api = this.withApiClient(DropboxSign.SignatureRequestApi);
    const response = await (api as any).signatureRequestUpdate(signatureRequestId, {
      signatureId: signerId,
      emailAddress,
      name,
    });
    return response.body;
  }
}
