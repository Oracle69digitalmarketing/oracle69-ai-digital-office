import { jest } from '@jest/globals';
import { SlackConnector } from '../slack.connector.js';

describe('SlackConnector', () => {
  let connector: SlackConnector;

  beforeEach(() => {
    connector = new SlackConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('slack');
    expect(connector.metadata.capabilities).toContain('send_message');
    expect(connector.metadata.capabilities).toContain('upload_file');
    expect(connector.metadata.capabilities).toContain('create_channel');
    expect(connector.metadata.capabilities).toContain('health_check');
  });

  it('should initialize as disconnected', async () => {
    const health = await connector.health();
    expect(health.status).toBe('disconnected');
  });

  it('should fail execute if not connected', async () => {
    const result = await connector.execute({
      action: 'send_message',
      params: { channel: 'general', text: 'Hello' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Slack client not initialized');
  });
});
