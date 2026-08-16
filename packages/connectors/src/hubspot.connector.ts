import { CRMConnector } from "./crm.connector.js";
import { ConnectorResult, ConnectorMetadata } from "./types.js";
import { Client } from "@hubspot/api-client";

export class HubSpotConnector extends CRMConnector {
  private hubspotClient?: Client;

  constructor() {
    const metadata: ConnectorMetadata = {
      id: "hubspot-01",
      name: "HubSpot Connector",
      type: "hubspot",
      version: "1.0.0",
      capabilities: [
        "create_lead",
        "update_lead",
        "create_company",
        "create_contact",
        "create_deal",
        "update_deal",
        "search",
        "health_check",
      ],
    };
    super(metadata);
  }

  async connect(credentials: any): Promise<void> {
    await super.connect(credentials);
    this.hubspotClient = new Client({ accessToken: credentials.accessToken });
  }

  async createLead(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const response: any = await this.hubspotClient.crm.contacts.basicApi.create({
      properties: { ...params, lifecyclestage: "lead" },
    });
    return { success: response.success, data: response };
  }

  async updateLead(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const { id, ...properties } = params;
    const response: any = await this.hubspotClient.crm.contacts.basicApi.update(id, {
      properties,
    });
    return { success: response.success, data: response };
  }

  async createCompany(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const response: any = await this.hubspotClient.crm.companies.basicApi.create({
      properties: params,
    });
    return { success: response.success, data: response };
  }

  async createContact(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const response: any = await this.hubspotClient.crm.contacts.basicApi.create({
      properties: params,
    });
    return { success: response.success, data: response };
  }

  async createDeal(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const response: any = await this.hubspotClient.crm.deals.basicApi.create({
      properties: params,
    });
    return { success: response.success, data: response };
  }

  async updateDeal(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const { id, ...properties } = params;
    const response: any = await this.hubspotClient.crm.deals.basicApi.update(id, {
      properties,
    });
    return { success: response.success, data: response };
  }

  async search(params: any): Promise<ConnectorResult> {
    if (!this.hubspotClient) throw new Error("HubSpot client not initialized");
    const { filterGroups, sort, properties, limit, after, objectType = "contacts" } = params;
    const response = await (this.hubspotClient.crm as any)[objectType].searchApi.doSearch({
      filterGroups,
      sorts: sort,
      properties,
      limit,
      after,
    });
    return { success: true, data: response };
  }

  async health(): Promise<any> {
    try {
      if (!this.hubspotClient) return { status: "disconnected" };
      // Simple call to verify token
      await this.hubspotClient.crm.contacts.basicApi.getPage(1);
      return {
        status: "connected",
        lastCheck: new Date(),
      };
    } catch (error: any) {
      return {
        status: "error",
        lastCheck: new Date(),
        error: error.message,
      };
    }
  }
}
