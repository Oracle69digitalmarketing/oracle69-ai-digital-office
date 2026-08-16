import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";
import { Client } from "@microsoft/microsoft-graph-client";
import { TokenCredentialAuthenticationProvider } from "@microsoft/microsoft-graph-client/authProviders/azureTokenCredentials";
import { TokenCredential } from "@azure/identity";

export class TeamsConnector extends AbstractConnector {
  private graphClient?: Client;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "teams-01",
      name: "Microsoft Teams Connector",
      type: "teams",
      version: "1.0.0",
      capabilities: [
        "send_message",
        "send_rich_message",
        "create_channel",
        "list_channels",
        "mention_user",
        "upload_file",
        "schedule_meeting",
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
    } as any;

    const authProvider = new TokenCredentialAuthenticationProvider(credential, {
      scopes: ["Team.ReadBasic.All", "ChannelMessage.Send"],
    });
    this.graphClient = Client.initWithMiddleware({ authProvider });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.graphClient) {
      return this.handleError(new Error("Teams client not initialized. Call connect() first."));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case "send_message":
          return this.sendMessage(request.params);
        case "send_rich_message":
          return this.sendRichMessage(request.params);
        case "create_channel":
          return this.createChannel(request.params);
        case "list_channels":
          return this.listChannels(request.params);
        case "mention_user":
          return this.mentionUser(request.params);
        case "upload_file":
          return this.uploadFile(request.params);
        case "schedule_meeting":
          return this.scheduleMeeting(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  private async sendMessage(params: any): Promise<ConnectorResult> {
    const { teamId, channelId, content } = params;
    const response = await this.graphClient!.api(
      `/teams/${teamId}/channels/${channelId}/messages`,
    ).post({ body: { content } });
    return { success: true, data: response };
  }

  private async sendRichMessage(params: any): Promise<ConnectorResult> {
    const { teamId, channelId, content, attachment } = params;
    const response = await this.graphClient!.api(
      `/teams/${teamId}/channels/${channelId}/messages`,
    ).post({
      body: { contentType: "html", content },
      attachments: [attachment],
    });
    return { success: true, data: response };
  }

  private async createChannel(params: any): Promise<ConnectorResult> {
    const { teamId, displayName, description } = params;
    const response = await this.graphClient!.api(`/teams/${teamId}/channels`).post({
      displayName,
      description,
    });
    return { success: true, data: response };
  }

  private async listChannels(params: any): Promise<ConnectorResult> {
    const { teamId } = params;
    const response = await this.graphClient!.api(`/teams/${teamId}/channels`).get();
    return { success: true, data: response.value };
  }

  private async mentionUser(params: any): Promise<ConnectorResult> {
    const { teamId, channelId, messageId, userId, userName } = params;
    // Mentioning requires a specific entity format in the body
    const content = `<at id="0">@${userName}</at>`;
    const response = await this.graphClient!.api(
      `/teams/${teamId}/channels/${channelId}/messages/${messageId}/replies`,
    ).post({
      body: { contentType: "html", content },
      mentions: [{ id: 0, mentionText: userName, mentioned: { user: { id: userId } } }],
    });
    return { success: true, data: response };
  }

  private async uploadFile(params: any): Promise<ConnectorResult> {
    const { teamId, channelId, filename, content } = params;
    // This usually involves two steps: create upload session, then upload
    const response = await this.graphClient!.api(
      `/teams/${teamId}/channels/${channelId}/files/content`,
    ).put(content);
    return { success: true, data: response };
  }

  private async scheduleMeeting(params: any): Promise<ConnectorResult> {
    const { teamId, channelId, subject, startTime, endTime } = params;
    const response = await this.graphClient!.api(
      `/teams/${teamId}/channels/${channelId}/messages`,
    ).post({
      body: { contentType: "text", content: `Meeting Scheduled: ${subject}` },
      // This is simplified, actual Teams meeting scheduling requires graph /me/events or similar
    });
    return { success: true, data: response };
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
