import { AbstractConnector } from './abstract-connector.js';
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from './types.js';
import { google, calendar_v3 } from 'googleapis';

export class GoogleCalendarConnector extends AbstractConnector {
  private calendarClient?: calendar_v3.Calendar;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'google-calendar-01',
      name: 'Google Calendar Connector',
      type: 'google-calendar',
      version: '1.0.0',
      capabilities: [
        'create_event',
        'update_event',
        'delete_event',
        'list_events',
        'get_availability',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    );
    auth.setCredentials({
      access_token: credentials.accessToken,
      refresh_token: credentials.refreshToken,
    });
    this.calendarClient = google.calendar({ version: 'v3', auth });
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    if (!this.calendarClient) {
      return this.handleError(new Error('Calendar client not initialized. Call connect() first.'));
    }

    return this.withRetry(async () => {
      switch (request.action) {
        case 'create_event':
          return this.createEvent(request.params);
        case 'update_event':
          return this.updateEvent(request.params);
        case 'delete_event':
          return this.deleteEvent(request.params);
        case 'list_events':
          return this.listEvents(request.params);
        case 'get_availability':
          return this.getAvailability(request.params);
        case 'health_check':
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported action: ${request.action}`);
      }
    }).catch(err => this.handleError(err));
  }

  private async createEvent(params: any): Promise<ConnectorResult> {
    const { summary, description, start, end, attendees } = params;
    const response = await this.calendarClient!.events.insert({
      calendarId: 'primary',
      requestBody: {
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: attendees?.map((email: string) => ({ email })),
      },
    });
    return { success: true, data: response.data };
  }

  private async updateEvent(params: any): Promise<ConnectorResult> {
    const { eventId, summary, description, start, end, attendees } = params;
    const response = await this.calendarClient!.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: {
        summary,
        description,
        start: { dateTime: start },
        end: { dateTime: end },
        attendees: attendees?.map((email: string) => ({ email })),
      },
    });
    return { success: true, data: response.data };
  }

  private async deleteEvent(params: any): Promise<ConnectorResult> {
    const { eventId } = params;
    await this.calendarClient!.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return { success: true, data: { eventId, status: 'deleted' } };
  }

  private async listEvents(params: any): Promise<ConnectorResult> {
    const { timeMin, timeMax, maxResults = 10 } = params;
    const response = await this.calendarClient!.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      maxResults,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return { success: true, data: response.data.items };
  }

  private async getAvailability(params: any): Promise<ConnectorResult> {
    const { timeMin, timeMax, items } = params;
    const response = await this.calendarClient!.freebusy.query({
      requestBody: {
        timeMin,
        timeMax,
        items: items || [{ id: 'primary' }],
      },
    });
    return { success: true, data: response.data.calendars };
  }
}