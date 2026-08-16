import { AbstractConnector } from "./abstract-connector.js";
import { ConnectorActionRequest, ConnectorResult, ConnectorMetadata } from "./types.js";

export abstract class CRMConnector extends AbstractConnector {
  constructor(metadata: ConnectorMetadata) {
    super(metadata);
  }

  async execute(request: ConnectorActionRequest): Promise<ConnectorResult> {
    return this.withRetry(async () => {
      switch (request.action) {
        case "create_lead":
          return this.createLead(request.params);
        case "update_lead":
          return this.updateLead(request.params);
        case "create_company":
          return this.createCompany(request.params);
        case "create_contact":
          return this.createContact(request.params);
        case "create_deal":
          return this.createDeal(request.params);
        case "update_deal":
          return this.updateDeal(request.params);
        case "search":
          return this.search(request.params);
        case "health_check":
          const health = await this.health();
          return { success: true, data: health };
        default:
          throw new Error(`Unsupported CRM action: ${request.action}`);
      }
    }).catch((err) => this.handleError(err));
  }

  abstract createLead(params: any): Promise<ConnectorResult>;
  abstract updateLead(params: any): Promise<ConnectorResult>;
  abstract createCompany(params: any): Promise<ConnectorResult>;
  abstract createContact(params: any): Promise<ConnectorResult>;
  abstract createDeal(params: any): Promise<ConnectorResult>;
  abstract updateDeal(params: any): Promise<ConnectorResult>;
  abstract search(params: any): Promise<ConnectorResult>;
}
