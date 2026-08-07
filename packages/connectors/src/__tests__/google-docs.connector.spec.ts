import { jest } from '@jest/globals';
import { GoogleDocsConnector } from '../google-docs.connector.js';

describe('GoogleDocsConnector', () => {
  let connector: GoogleDocsConnector;

  beforeEach(() => {
    connector = new GoogleDocsConnector();
  });

  it('should have correct metadata', () => {
    expect(connector.metadata.type).toBe('google-docs');
    expect(connector.metadata.capabilities).toContain('create_document');
    expect(connector.metadata.capabilities).toContain('update_document');
    expect(connector.metadata.capabilities).toContain('append_content');
    expect(connector.metadata.capabilities).toContain('read_document');
    expect(connector.metadata.capabilities).toContain('export_pdf');
    expect(connector.metadata.capabilities).toContain('share_document');
  });

  it('should initialize as disconnected', async () => {
    const health = await connector.health();
    expect(health.status).toBe('disconnected');
  });

  it('should fail execute if not connected', async () => {
    const result = await connector.execute({
      action: 'create_document',
      params: { title: 'Test' },
      organizationId: 'test-org'
    });
    expect(result.success).toBe(false);
    expect(result.error?.message).toContain('Docs/Drive client not initialized');
  });
});
