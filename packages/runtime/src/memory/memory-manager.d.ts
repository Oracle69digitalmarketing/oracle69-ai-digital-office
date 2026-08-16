import { IMemoryManager, MemoryRecord } from "./memory.types.js";
import { EventBus } from "../events/event-bus.js";
export declare class MemoryManager implements IMemoryManager {
  private readonly eventBus;
  private storage;
  constructor(eventBus: EventBus);
  save(record: MemoryRecord): Promise<void>;
  retrieve(query: string): Promise<MemoryRecord[]>;
  private emit;
}
//# sourceMappingURL=memory-manager.d.ts.map
