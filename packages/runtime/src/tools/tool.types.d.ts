import { IRuntimeContext } from "../runtime.types.js";
export interface ToolRequest {
  toolId: string;
  connectorId: string;
  params: Record<string, any>;
}
export interface ToolResponse {
  success: boolean;
  data?: any;
  error?: string;
}
export interface IToolRegistry {
  resolveConnector(connectorId: string): any;
  validateToolAccess(agentId: string, toolId: string): boolean;
}
export interface IToolRouter {
  execute(request: ToolRequest, context: IRuntimeContext): Promise<ToolResponse>;
}
//# sourceMappingURL=tool.types.d.ts.map
