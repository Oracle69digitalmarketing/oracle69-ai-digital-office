var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var CheckpointManager_1;
import { Injectable, Logger } from '@nestjs/common';
let CheckpointManager = CheckpointManager_1 = class CheckpointManager {
    logger = new Logger(CheckpointManager_1.name);
    async save(workflowId, checkpoint) {
        this.logger.log(`Checkpoint saved for workflow ${workflowId}: ${checkpoint}`);
    }
};
CheckpointManager = CheckpointManager_1 = __decorate([
    Injectable()
], CheckpointManager);
export { CheckpointManager };
let RetryManager = class RetryManager {
    async shouldRetry(retryCount, maxAttempts) {
        return retryCount < maxAttempts;
    }
};
RetryManager = __decorate([
    Injectable()
], RetryManager);
export { RetryManager };
let CompensationManager = class CompensationManager {
    async compensate(workflowId, task) {
        // Logic to handle compensation tasks
    }
};
CompensationManager = __decorate([
    Injectable()
], CompensationManager);
export { CompensationManager };
let ApprovalManager = class ApprovalManager {
    async requestApproval(workflowId, task) {
        // Logic to handle human-in-the-loop approvals
    }
};
ApprovalManager = __decorate([
    Injectable()
], ApprovalManager);
export { ApprovalManager };
