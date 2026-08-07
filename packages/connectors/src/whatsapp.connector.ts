import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import axios from 'axios';

export class WhatsAppBusinessConnector extends AbstractConnector {
  private axiosInstance?: any;
  private phoneNumberId?: string;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'whatsapp-01',
      name: 'WhatsApp Business Connector',
      type: 'whatsapp',
      version: '1.0.0',
      capabilities: [
        'send_text',
        'send_template',
        'send_image',
        'send_document',
        'send_audio',
        'send_video',
        'send_interactive_button',
        'send_list',
        'send_location',
        'mark_read',
        'get_profile',
        'get_phone_number_info',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.phoneNumberId = credentials.phoneNumberId;
    this.axiosInstance = axios.create({
      baseURL: `https://graph.facebook.com/v20.0/${this.phoneNumberId}`,
      headers: {
        'Authorization': `Bearer ${credentials.accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.axiosInstance) {
      return this.handleError(new Error('WhatsApp client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'send_text':
          return this.sendText(request.params);
        case 'send_template':
          return this.sendTemplate(request.params);
        // ... add other methods as needed ...
        case 'health_check':
          return { success: true, data: await this.health() };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async sendText(params: any): Promise<ConnectorResult> {
    const { to, text } = params;
    const response = await this.axiosInstance!.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: text },
    });
    return { success: true, data: response.data };
  }

  private async sendTemplate(params: any): Promise<ConnectorResult> {
    const { to, templateName, languageCode, components } = params;
    const response = await this.axiosInstance!.post('/messages', {
      messaging_product: 'whatsapp',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    });
    return { success: true, data: response.data };
  }
}
