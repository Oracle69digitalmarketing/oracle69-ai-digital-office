import { Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { IDepartmentManager } from './department.types.js';
export declare abstract class DepartmentManager implements IDepartmentManager {
    protected readonly deptId: string;
    protected readonly eventEmitter: EventEmitter2;
    protected readonly logger: Logger;
    constructor(deptId: string, eventEmitter: EventEmitter2);
    delegateTask(taskId: string, agentId: string): Promise<void>;
    generateReport(): Promise<string>;
}
//# sourceMappingURL=department-manager.d.ts.map