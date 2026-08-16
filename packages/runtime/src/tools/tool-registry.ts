import { Injectable, Logger } from "@nestjs/common";
import { IToolRegistry } from "./tool.types.js";

@Injectable()
export class ToolRegistry implements IToolRegistry {
  private readonly logger = new Logger(ToolRegistry.name);
  private connectors = new Map<string, any>();

  constructor() {
    // In a real scenario, this would dynamically load connectors from Phase 5.
    // For now, we stub them.
    this.connectors.set("google-drive", { name: "GoogleDriveConnector" });
  }

  resolveConnector(connectorId: string): any {
    const connector = this.connectors.get(connectorId);
    if (!connector) {
      throw new Error(`Connector ${connectorId} not found`);
    }
    return connector;
  }

  validateToolAccess(agentId: string, toolId: string): boolean {
    // Placeholder for RBAC logic
    return true;
  }
}
