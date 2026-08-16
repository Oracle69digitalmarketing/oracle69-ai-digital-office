import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";
import { google, gmail_v1 } from "googleapis";

export class GmailConnector extends AbstractConnector {
  private gmailClient?: gmail_v1.Gmail;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "gmail-01",
      name: "Gmail Connector",
      type: "gmail",
      version: "1.0.0",
      capabilities: [
        "send_email",
        "reply_email",
        "create_draft",
        "search_emails",
        "read_thread",
        "get_attachments",
        "health_check",
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    this.gmailClient = google.gmail({ version: "v1", auth });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.gmailClient) {
      return this.handleError(new Error("Gmail client not initialized. Call connect() first."));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case "send_email":
          return this.sendEmail(request.params);
        case "reply_email":
          return this.replyEmail(request.params);
        case "create_draft":
          return this.createDraft(request.params);
        case "search_emails":
          return this.searchEmails(request.params);
        case "read_thread":
          return this.readThread(request.params);
        case "get_attachments":
          return this.getAttachments(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  private async sendEmail(params: any): Promise<ConnectorResult> {
    const { to, subject, body } = params;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;
    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      body,
    ];
    const message = messageParts.join("\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await this.gmailClient!.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
      },
    });
    return { success: true, data: response.data };
  }

  private async replyEmail(params: any): Promise<ConnectorResult> {
    const { threadId, body } = params;
    const thread = await this.gmailClient!.users.threads.get({
      userId: "me",
      id: threadId,
    });

    const lastMessage = thread.data.messages?.pop();
    if (!lastMessage) throw new Error("Thread is empty");

    const subjectHeader = lastMessage.payload?.headers?.find(
      (h) => h.name?.toLowerCase() === "subject",
    );
    const messageIdHeader = lastMessage.payload?.headers?.find(
      (h) => h.name?.toLowerCase() === "message-id",
    );
    const toHeader = lastMessage.payload?.headers?.find((h) => h.name?.toLowerCase() === "from");

    const subject = subjectHeader?.value?.startsWith("Re:")
      ? subjectHeader.value
      : `Re: ${subjectHeader?.value}`;
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString("base64")}?=`;

    const messageParts = [
      `To: ${toHeader?.value}`,
      `In-Reply-To: ${messageIdHeader?.value}`,
      `References: ${messageIdHeader?.value}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${utf8Subject}`,
      "",
      body,
    ];
    const message = messageParts.join("\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await this.gmailClient!.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage,
        threadId,
      },
    });
    return { success: true, data: response.data };
  }

  private async createDraft(params: any): Promise<ConnectorResult> {
    const { to, subject, body } = params;
    const messageParts = [
      `To: ${to}`,
      "Content-Type: text/html; charset=utf-8",
      "MIME-Version: 1.0",
      `Subject: ${subject}`,
      "",
      body,
    ];
    const message = messageParts.join("\n");
    const encodedMessage = Buffer.from(message)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const response = await this.gmailClient!.users.drafts.create({
      userId: "me",
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });
    return { success: true, data: response.data };
  }

  private async searchEmails(params: any): Promise<ConnectorResult> {
    const { q, maxResults = 10 } = params;
    const response = await this.gmailClient!.users.messages.list({
      userId: "me",
      q,
      maxResults,
    });
    return { success: true, data: response.data.messages };
  }

  private async readThread(params: any): Promise<ConnectorResult> {
    const { threadId } = params;
    const response = await this.gmailClient!.users.threads.get({
      userId: "me",
      id: threadId,
    });
    return { success: true, data: response.data };
  }

  private async getAttachments(params: any): Promise<ConnectorResult> {
    const { messageId, attachmentId } = params;
    const response = await this.gmailClient!.users.messages.attachments.get({
      userId: "me",
      messageId,
      id: attachmentId,
    });
    return { success: true, data: response.data };
  }
}
