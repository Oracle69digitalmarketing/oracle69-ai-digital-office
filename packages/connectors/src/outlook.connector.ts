import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { TokenCredential } from "@azure/identity";

export class OutlookConnector extends AbstractConnector {
  private graphClient?: Client;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "outlook-01",
      name: "Outlook Connector",
      type: "outlook",
      version: "1.0.0",
      capabilities: [
        "send_email",
        "read_email",
        "search_email",
        "reply_email",
        "create_draft",
        "get_attachments",
        "list_folders",
        "health_check",
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    const credential: TokenCredential = {
      getToken: async () => ({
        token: credentials.accessToken,
        expiresOnTimestamp: Date.now() + 3600000,
      }),
    } as any; // Simplified for MVP

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["Mail.Read", "Mail.Send"],
    });
    this.graphClient = Client.initWithMiddleware({ authProvider });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.graphClient) {
      return this.handleError(new Error("Outlook client not initialized. Call connect() first."));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case "send_email":
          return this.sendEmail(request.params);
        case "read_email":
          return this.readEmail(request.params);
        case "search_email":
          return this.searchEmail(request.params);
        case "reply_email":
          return this.replyEmail(request.params);
        case "create_draft":
          return this.createDraft(request.params);
        case "get_attachments":
          return this.getAttachments(request.params);
        case "list_folders":
          return this.listFolders(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  private async sendEmail(params: any): Promise<ConnectorResult> {
    const { message } = params;
    await this.graphClient!.api("/me/sendMail").post({ message });
    return { success: true, data: { status: "sent" } };
  }

  private async readEmail(params: any): Promise<ConnectorResult> {
    const { messageId } = params;
    const response = await this.graphClient!.api(`/me/messages/${messageId}`).get();
    return { success: true, data: response };
  }

  private async searchEmail(params: any): Promise<ConnectorResult> {
    const { query } = params;
    const response = await this.graphClient!.api("/me/messages").filter(query).get();
    return { success: true, data: response.value };
  }

  private async replyEmail(params: any): Promise<ConnectorResult> {
    const { messageId, comment } = params;
    await this.graphClient!.api(`/me/messages/${messageId}/reply`).post({ comment });
    return { success: true, data: { status: "replied" } };
  }

  private async createDraft(params: any): Promise<ConnectorResult> {
    const { message } = params;
    const response = await this.graphClient!.api("/me/messages").post({ message });
    return { success: true, data: response };
  }

  private async getAttachments(params: any): Promise<ConnectorResult> {
    const { messageId } = params;
    const response = await this.graphClient!.api(`/me/messages/${messageId}/attachments`).get();
    return { success: true, data: response.value };
  }

  private async listFolders(params: any): Promise<ConnectorResult> {
    const response = await this.graphClient!.api("/me/mailFolders").get();
    return { success: true, data: response.value };
  }

  async health(): Promise<any> {
    try {
      if (!this.graphClient) return { status: "disconnected" };
      await this.graphClient.api("/me").get();
      return { status: "connected", lastCheck: new Date() };
    } catch (error: any) {
      return { status: "error", lastCheck: new Date(), error: error.message };
    }
  }
}
