import { Injectable, Logger } from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { IDepartmentManager } from "./department.types.js";

@Injectable()
export abstract class DepartmentManager implements IDepartmentManager {
  protected readonly logger = new Logger(this.constructor.name);

  constructor(
    protected readonly deptId: string,
    protected readonly eventEmitter: EventEmitter2,
  ) {}

  async delegateTask(taskId: string, agentId: string): Promise<void> {
    this.logger.log(`Delegating task ${taskId} to agent ${agentId}`);
  }

  async generateReport(): Promise<string> {
    return `Report for department ${this.deptId}`;
  }
}
