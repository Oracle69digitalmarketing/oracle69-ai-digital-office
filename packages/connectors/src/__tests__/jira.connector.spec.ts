import { jest } from '@jest/globals';
import { JiraConnector } from '../jira.connector.js';

describe('JiraConnector', () => {
  let connector: JiraConnector;

  beforeEach(() => {
    connector = new JiraConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('jira');
    expect(connector.metadata.capabilities).toContain('create_issue');
    expect(connector.metadata.capabilities).toContain('search_issues');
    expect(connector.metadata.capabilities).toContain('health_check');
  });

  it('should initialize as disconnected', async () => {
    const health = await connector.health();
    expect(health.status).toBe('disconnected');
  });

  it('should fail execute if not connected', async () => {
    const result = await connector.execute({
      action: 'create_issue',
      params: { fields: { project: { key: 'TEST' } } },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Jira client not initialized');
  });
});
