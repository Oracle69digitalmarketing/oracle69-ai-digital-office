var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var WorkflowEngine_1;
import { Injectable, Logger } from '@nestjs/common';
import { WorkflowState } from './workflow.types.js';
import { WorkflowStateMachine } from './workflow-state-machine.js';
import { CheckpointManager, RetryManager, CompensationManager, ApprovalManager } from './workflow-managers.js';
import { RuntimeEventType } from '../events/runtime.events.js';
import { EventBus } from '../events/event-bus.js';
let WorkflowEngine = WorkflowEngine_1 = class WorkflowEngine {
    eventBus;
    checkpointManager;
    retryManager;
    compensationManager;
    approvalManager;
    logger = new Logger(WorkflowEngine_1.name);
    constructor(eventBus, checkpointManager, retryManager, compensationManager, approvalManager) {
        this.eventBus = eventBus;
        this.checkpointManager = checkpointManager;
        this.retryManager = retryManager;
        this.compensationManager = compensationManager;
        this.approvalManager = approvalManager;
    }
    async createWorkflow(planId, context) {
        const workflow = {
            metadata: {
                id: `wf-${Date.now()}`,
                planId,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                state: WorkflowState.CREATED,
            },
            context,
            currentTaskIndex: 0,
            checkpoint: null,
            retryCount: 0,
        };
        this.emit(RuntimeEventType.WORKFLOW_CREATED, { workflowId: workflow.metadata.id, planId });
        return workflow;
    }
    async startWorkflow(workflow) {
        if (!WorkflowStateMachine.canTransition(workflow.metadata.state, WorkflowState.RUNNING)) {
            throw new Error(`Invalid transition from ${workflow.metadata.state} to RUNNING`);
        }
        workflow.metadata.state = WorkflowState.RUNNING;
        this.emit(RuntimeEventType.WORKFLOW_STARTED, { workflowId: workflow.metadata.id });
    }
    emit(type, payload) {
        this.eventBus.publish(type, payload, { source: 'WorkflowEngine' });
    }
};
WorkflowEngine = WorkflowEngine_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [EventBus,
        CheckpointManager,
        RetryManager,
        CompensationManager,
        ApprovalManager])
], WorkflowEngine);
export { WorkflowEngine };
