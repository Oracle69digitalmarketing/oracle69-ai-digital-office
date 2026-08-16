import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";
import { WebClient } from "@slack/web-api";
import { Readable } from "stream";

export class SlackConnector extends AbstractConnector {
  private slackClient?: WebClient;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "slack-01",
      name: "Slack Connector",
      type: "slack",
      version: "1.0.0",
      capabilities: [
        "send_message",
        "send_rich_message",
        "upload_file",
        "create_channel",
        "invite_user",
        "search_channels",
        "search_users",
        "health_check",
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.slackClient = new WebClient(credentials.accessToken);
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.slackClient) {
      return this.handleError(new Error("Slack client not initialized. Call connect() first."));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case "send_message":
          return this.sendMessage(request.params);
        case "send_rich_message":
          return this.sendRichMessage(request.params);
        case "upload_file":
          return this.uploadFile(request.params);
        case "create_channel":
          return this.createChannel(request.params);
        case "invite_user":
          return this.inviteUser(request.params);
        case "search_channels":
          return this.searchChannels(request.params);
        case "search_users":
          return this.searchUsers(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  private async sendMessage(params: any): Promise<ConnectorResult> {
    const { channel, text, thread_ts } = params;
    const response = await this.slackClient!.chat.postMessage({
      channel,
      text,
      thread_ts,
    });
    return { success: true, data: response };
  }

  private async sendRichMessage(params: any): Promise<ConnectorResult> {
    const { channel, blocks, text, thread_ts } = params;
    const response = await this.slackClient!.chat.postMessage({
      channel,
      blocks,
      text,
      thread_ts,
    });
    return { success: true, data: response };
  }

  private async uploadFile(params: any): Promise<ConnectorResult> {
    const { channels, file, filename, title, initial_comment } = params;
    const response = await this.slackClient!.files.uploadV2({
      channel_id: channels,
      file: typeof file === "string" ? Buffer.from(file) : file,
      filename,
      title,
      initial_comment,
    });
    return { success: true, data: response };
  }

  private async createChannel(params: any): Promise<ConnectorResult> {
    const { name, is_private } = params;
    const response = await this.slackClient!.conversations.create({
      name,
      is_private,
    });
    return { success: true, data: response.channel };
  }

  private async inviteUser(params: any): Promise<ConnectorResult> {
    const { channel, users } = params;
    const response = await this.slackClient!.conversations.invite({
      channel,
      users,
    });
    return { success: true, data: response.channel };
  }

  private async searchChannels(params: any): Promise<ConnectorResult> {
    const { types = "public_channel,private_channel", cursor, limit = 100 } = params;
    const response = await this.slackClient!.conversations.list({
      types,
      cursor,
      limit,
    });
    return { success: true, data: response.channels };
  }

  private async searchUsers(params: any): Promise<ConnectorResult> {
    const { cursor, limit = 100 } = params;
    const response = await this.slackClient!.users.list({
      cursor,
      limit,
    });
    return { success: true, data: response.members };
  }

  async health(): Promise<any> {
    try {
      if (!this.slackClient) return { status: "disconnected" };
      const response = await this.slackClient.auth.test();
      return {
        status: response.ok ? "connected" : "error",
        lastCheck: new Date(),
        details: response,
      };
    } catch (error: any) {
      return {
        status: "error",
        lastCheck: new Date(),
        error: error.message,
      };
    }
  }
}
