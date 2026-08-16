import { IToolRouter, ToolRequest, ToolResponse } from "./tool.types.js";
import type { IToolRegistry } from "./tool.types.js";
import { IRuntimeContext } from "../runtime.types.js";
import { EventBus } from "../events/event-bus.js";
export declare class ToolRouter implements IToolRouter {
  private readonly registry;
  private readonly eventBus;
  private readonly logger;
  constructor(registry: IToolRegistry, eventBus: EventBus);
  execute(request: ToolRequest, context: IRuntimeContext): Promise<ToolResponse>;
  private emit;
}
//# sourceMappingURL=tool-router.d.ts.map
