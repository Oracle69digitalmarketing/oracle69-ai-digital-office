import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IMemoryManager, MemoryRecord } from './memory.types.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeEvent } from '../events/runtime.events.js';

@Injectable()
export class MemoryManager implements IMemoryManager {
  private storage = new Map<string, MemoryRecord>();

  constructor(private readonly eventEmitter: EventEmitter2) {}

  async save(record: MemoryRecord): Promise<void> {
    this.storage.set(record.id, record);
    this.emit(RuntimeEventType.MEMORY_CREATED, { id: record.id, type: record.type });
  }

  async retrieve(query: string): Promise<MemoryRecord[]> {
    const results = Array.from(this.storage.values()).filter(r => JSON.stringify(r).includes(query));
    this.emit(RuntimeEventType.MEMORY_RETRIEVED, { query, count: results.length });
    return results;
  }

  private emit(type: RuntimeEventType, payload: any): void {
    this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
  }
}
