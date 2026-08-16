import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";
import axios, { AxiosInstance } from "axios";

export class ZoomConnector extends AbstractConnector {
  private zoomClient?: AxiosInstance;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "zoom-01",
      name: "Zoom Connector",
      type: "zoom",
      version: "1.0.0",
      capabilities: [
        "create_meeting",
        "update_meeting",
        "cancel_meeting",
        "list_meetings",
        "invite_participants",
        "health_check",
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.zoomClient = axios.create({
      baseURL: "https://api.zoom.us/v2",
      headers: {
        Authorization: `Bearer ${credentials.accessToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.zoomClient) {
      return this.handleError(new Error("Zoom client not initialized. Call connect() first."));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case "create_meeting":
          return this.createMeeting(request.params);
        case "update_meeting":
          return this.updateMeeting(request.params);
        case "cancel_meeting":
          return this.cancelMeeting(request.params);
        case "list_meetings":
          return this.listMeetings(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  private async createMeeting(params: any): Promise<ConnectorResult> {
    const response = await this.zoomClient!.post("/users/me/meetings", params);
    return { success: true, data: response.data };
  }

  private async updateMeeting(params: any): Promise<ConnectorResult> {
    const { meetingId, ...paramsToUpdate } = params;
    const response = await this.zoomClient!.patch(`/meetings/${meetingId}`, paramsToUpdate);
    return { success: true, data: response.data };
  }

  private async cancelMeeting(params: any): Promise<ConnectorResult> {
    const { meetingId } = params;
    await this.zoomClient!.delete(`/meetings/${meetingId}`);
    return { success: true, data: { meetingId, status: "canceled" } };
  }

  private async listMeetings(params: any): Promise<ConnectorResult> {
    const response = await this.zoomClient!.get("/users/me/meetings");
    return { success: true, data: response.data.meetings };
  }

  async health(): Promise<any> {
    try {
      if (!this.zoomClient) return { status: "disconnected" };
      await this.zoomClient.get("/users/me");
      return { status: "connected", lastCheck: new Date() };
    } catch (error: any) {
      return { status: "error", lastCheck: new Date(), error: error.message };
    }
  }
}
