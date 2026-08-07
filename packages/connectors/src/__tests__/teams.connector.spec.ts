import { jest } from '@jest/globals';
import { TeamsConnector } from '../teams.connector.js';

describe('TeamsConnector', () => {
  let connector: TeamsConnector;

  beforeEach(() => {
    connector = new TeamsConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('teams');
    expect(connector.metadata.capabilities).toContain('send_message');
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
      params: { teamId: 't1', channelId: 'c1', content: 'Hi' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Teams client not initialized');
  });
});
