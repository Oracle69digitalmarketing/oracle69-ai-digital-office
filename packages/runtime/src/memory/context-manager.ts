import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IContextManager } from './memory.types.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';

@Injectable()
export class ContextManager implements IContextManager {
  constructor(private readonly eventEmitter: EventEmitter2) {}

  async hydrate(agentId: string, workflowId: string): Promise<Record<string, any>> {
    this.emit(RuntimeEventType.CONTEXT_LOADED, { agentId, workflowId });
    return { agentId, workflowId, data: {} };
  }

  compress(context: Record<string, any>): Record<string, any> {
    this.emit(RuntimeEventType.CONTEXT_COMPRESSED, {});
    return { ...context, compressed: true };
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
  }
}
