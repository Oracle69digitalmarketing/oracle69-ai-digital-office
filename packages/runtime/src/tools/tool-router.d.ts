import { EventEmitter2 } from '@nestjs/event-emitter';
import { IToolRouter, ToolRequest, ToolResponse } from './tool.types.js';
import type { IToolRegistry } from './tool.types.js';
import { IRuntimeContext } from '../runtime.types.js';
export declare class ToolRouter implements IToolRouter {
    private readonly registry;
    private readonly eventEmitter;
    private readonly logger;
    constructor(registry: IToolRegistry, eventEmitter: EventEmitter2);
    execute(request: ToolRequest, context: IRuntimeContext): Promise<ToolResponse>;
    private emit;
}
//# sourceMappingURL=tool-router.d.ts.map