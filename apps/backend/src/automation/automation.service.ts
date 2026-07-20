/* eslint-disable */
import { Injectable, Logger } from '@nestjs/common';


export type Trigger = "ProjectApproved" | "TaskCompleted";
export type Action = "NotifyFinance" | "CreateDocuments" | "AssignTasks";

@Injectable()
export class AutomationEngineService {
  private readonly logger = new Logger(AutomationEngineService.name);

  async triggerWorkflow(
    trigger: Trigger, // eslint-disable-line @typescript-eslint/no-unused-vars
    _payload: any,
  ) {
    this.logger.log(`Workflow triggered: ${trigger}`);

    if (trigger === "ProjectApproved") {
      this.logger.log("Executing: NotifyFinance -> CreateDocuments -> AssignTasks");
    }
  }
}
