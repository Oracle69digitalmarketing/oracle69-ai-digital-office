import { CRMConnector } from './crm.connector.js';
import { ConnectorResult, ConnectorMetadata } from './types.js';
import * as jsforce from 'jsforce';

export class SalesforceConnector extends CRMConnector {
  private sfClient?: jsforce.Connection;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: 'salesforce-01',
      name: 'Salesforce Connector',
      type: 'salesforce',
      version: '1.0.0',
      capabilities: [
        'create_lead',
        'update_lead',
        'create_company',
        'create_contact',
        'create_deal',
        'update_deal',
        'search',
        'health_check'
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.sfClient = new jsforce.Connection({
      accessToken: credentials.accessToken,
      instanceUrl: credentials.instanceUrl,
    });
  }

  async createLead(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const response: any = await this.sfClient.sobject('Lead').create(params);
    return { success: response.success, data: response };
  }

  async updateLead(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const { id, ...properties } = params;
    const response: any = await this.sfClient.sobject('Lead').update({ Id: id, ...properties });
    return { success: response.success, data: response };
  }

  async createCompany(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const response: any = await this.sfClient.sobject('Account').create(params);
    return { success: response.success, data: response };
  }

  async createContact(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const response: any = await this.sfClient.sobject('Contact').create(params);
    return { success: response.success, data: response };
  }

  async createDeal(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const response: any = await this.sfClient.sobject('Opportunity').create(params);
    return { success: response.success, data: response };
  }

  async updateDeal(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const { id, ...properties } = params;
    const response: any = await this.sfClient.sobject('Opportunity').update({ Id: id, ...properties });
    return { success: response.success, data: response };
  }

  async search(params: any): Promise<ConnectorResult> {
    if (!this.sfClient) throw new Error('Salesforce client not initialized');
    const { query } = params; // Salesforce uses SOQL
    const response = await this.sfClient.query(query);
    return { success: true, data: response.records };
  }

  async health(): Promise<any> {
    try {
      if (!this.sfClient) return { status: 'disconnected' };
      await this.sfClient.identity();
      return {
        status: 'connected',
        lastCheck: new Date(),
      };
    } catch (error: any) {
      return {
        status: 'error',
        lastCheck: new Date(),
        error: error.message,
      };
    }
  }
}