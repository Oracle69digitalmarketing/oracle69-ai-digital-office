import { jest } from '@jest/globals';
import { SalesforceConnector } from '../salesforce.connector.js';

describe('SalesforceConnector', () => {
  let connector: SalesforceConnector;

  beforeEach(() => {
    connector = new SalesforceConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('salesforce');
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
      params: { LastName: 'Doe', Company: 'Acme' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Salesforce client not initialized');
  });
});
