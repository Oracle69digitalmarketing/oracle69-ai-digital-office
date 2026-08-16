import { Inject, Injectable, Logger } from "@nestjs/common";
import { IToolRouter, ToolRequest, ToolResponse } from "./tool.types.js";
import type { IToolRegistry } from "./tool.types.js";
import { IRuntimeContext } from "../runtime.types.js";
import { RuntimeEventType, RuntimeEventOptions } from "../events/runtime.events.js";
import { EventBus } from "../events/event-bus.js";
import { ToolRegistry } from "./tool-registry.js";

@Injectable()
export class ToolRouter implements IToolRouter {
  private readonly logger = new Logger(ToolRouter.name);

  constructor(
    @Inject(ToolRegistry) private readonly registry: IToolRegistry,
    private readonly eventBus: EventBus,
  ) {}

  async execute(request: ToolRequest, context: IRuntimeContext): Promise<ToolResponse> {
    this.emit(
      RuntimeEventType.TOOL_EXECUTION_STARTED,
      { toolId: request.toolId, traceId: context.traceId },
      { context },
    );

    try {
      const connector = this.registry.resolveConnector(request.connectorId);
      this.emit(
        RuntimeEventType.TOOL_CONNECTOR_SELECTED,
        { connectorId: request.connectorId },
        { context },
      );

      // Credential injection would happen here in a real implementation

      // Execute connector (simulated)
      this.logger.log(`Executing tool ${request.toolId} via ${request.connectorId}`);

      const response: ToolResponse = { success: true, data: { status: "executed" } };
      this.emit(RuntimeEventType.TOOL_EXECUTION_COMPLETED, { toolId: request.toolId }, { context });

      return response;
    } catch (error) {
      this.emit(
        RuntimeEventType.TOOL_EXECUTION_FAILED,
        { toolId: request.toolId, error: String(error) },
        { context },
      );
      return { success: false, error: String(error) };
    }
  }

  private emit(
    type: RuntimeEventType,
    payload: Record<string, unknown>,
    options: RuntimeEventOptions = {},
  ): void {
    this.eventBus.publish(type, payload, { source: "ToolRouter", ...options });
  }
}
