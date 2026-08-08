import { EventEmitter2 } from '@nestjs/event-emitter';
import { IMemoryManager, MemoryRecord } from './memory.types.js';
export declare class MemoryManager implements IMemoryManager {
    private readonly eventEmitter;
    private storage;
    constructor(eventEmitter: EventEmitter2);
    save(record: MemoryRecord): Promise<void>;
    retrieve(query: string): Promise<MemoryRecord[]>;
    private emit;
}
//# sourceMappingURL=memory-manager.d.ts.map