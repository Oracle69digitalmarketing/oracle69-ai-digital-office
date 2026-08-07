import { jest } from '@jest/globals';
import { GmailConnector } from '../gmail.connector.js';

describe('GmailConnector', () => {
  let connector: GmailConnector;

  beforeEach(() => {
    connector = new GmailConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('gmail');
    expect(connector.metadata.capabilities).toContain('send_email');
    expect(connector.metadata.capabilities).toContain('reply_email');
    expect(connector.metadata.capabilities).toContain('create_draft');
    expect(connector.metadata.capabilities).toContain('search_emails');
    expect(connector.metadata.capabilities).toContain('read_thread');
    expect(connector.metadata.capabilities).toContain('get_attachments');
  });

  it('should initialize as disconnected', async () => {
    const health = await connector.health();
    expect(health.status).toBe('disconnected');
  });

  it('should fail execute if not connected', async () => {
    const result = await connector.execute({
      action: 'send_email',
      params: { to: 'test@example.com', subject: 'Test', body: 'Hello' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Gmail client not initialized');
  });
});
