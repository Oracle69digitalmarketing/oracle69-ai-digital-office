import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToolRouter, ToolRequest, ToolResponse } from './tool.types.js';
import type { IToolRegistry } from './tool.types.js';
import { IRuntimeContext } from '../runtime.types.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';

@Injectable()
export class ToolRouter implements IToolRouter {
  private readonly logger = new Logger(ToolRouter.name);

  constructor(
    private readonly registry: IToolRegistry,
    private readonly eventEmitter: EventEmitter2
  ) {}

  async execute(request: ToolRequest, context: IRuntimeContext): Promise<ToolResponse> {
    this.emit(RuntimeEventType.TOOL_EXECUTION_STARTED, { toolId: request.toolId, traceId: context.traceId });

    try {
      const connector = this.registry.resolveConnector(request.connectorId);
      this.emit(RuntimeEventType.TOOL_CONNECTOR_SELECTED, { connectorId: request.connectorId });

      // Credential injection would happen here in a real implementation
      
      // Execute connector (simulated)
      this.logger.log(`Executing tool ${request.toolId} via ${request.connectorId}`);
      
      const response: ToolResponse = { success: true, data: { status: 'executed' } };
      this.emit(RuntimeEventType.TOOL_EXECUTION_COMPLETED, { toolId: request.toolId });
      
      return response;
    } catch (error) {
      this.emit(RuntimeEventType.TOOL_EXECUTION_FAILED, { toolId: request.toolId, error: String(error) });
      return { success: false, error: String(error) };
    }
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
  }
}
