import { jest } from '@jest/globals';
import { HubSpotConnector } from '../hubspot.connector.js';

describe('HubSpotConnector', () => {
  let connector: HubSpotConnector;

  beforeEach(() => {
    connector = new HubSpotConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('hubspot');
    expect(connector.metadata.capabilities).toContain('create_lead');
    expect(connector.metadata.capabilities).toContain('create_deal');
    expect(connector.metadata.capabilities).toContain('health_check');
  });

  it('should initialize as disconnected', async () => {
    const health = await connector.health();
    expect(health.status).toBe('disconnected');
  });

  it('should fail execute if not connected', async () => {
    const result = await connector.execute({
      action: 'create_lead',
      params: { email: 'test@example.com' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('crm'); 
  });
});
