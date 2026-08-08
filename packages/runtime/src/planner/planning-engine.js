var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PlanningEngine_1;
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { TaskType } from './planner.types.js';
import { RuntimeEvent, RuntimeEventType } from '../events/runtime.events.js';
import { RuntimeError } from '../errors/runtime.errors.js';
let PlanningEngine = PlanningEngine_1 = class PlanningEngine {
    registry;
    eventEmitter;
    logger = new Logger(PlanningEngine_1.name);
    constructor(registry, eventEmitter) {
        this.registry = registry;
        this.eventEmitter = eventEmitter;
    }
    /**
     * Generates a deterministic execution plan for a business goal.
     */
    async generatePlan(goal, context) {
        this.logger.log(`Generating plan for goal: ${goal}`);
        this.emit(RuntimeEventType.PLANNING_STARTED, { goal, traceId: context.traceId });
        try {
            // 1. Decompose goal into task templates
            const tasks = await this.decomposeGoal(goal);
            // 2. Resolve dependencies and build the graph
            this.resolveDependencies(tasks);
            // 3. Select agents for each task
            for (const task of tasks) {
                this.selectAgent(task);
            }
            const plan = {
                goal,
                tasks: new Map(tasks.map(t => [t.id, t])),
                metadata: {
                    createdAt: new Date().toISOString(),
                    version: '1.0.0',
                    traceId: context.traceId,
                    orgId: context.orgId,
                }
            };
            // 4. Validate the final plan
            const validation = await this.validatePlan(plan);
            if (!validation.valid) {
                throw new RuntimeError(`Plan validation failed: ${validation.errors?.join(', ')}`);
            }
            this.emit(RuntimeEventType.PLANNING_COMPLETED, { goal, taskCount: tasks.length });
            return plan;
        }
        catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.emit(RuntimeEventType.PLANNING_FAILED, { goal, error: message });
            throw error;
        }
    }
    /**
     * Validates the execution plan for structural integrity and feasibility.
     */
    async validatePlan(plan) {
        const errors = [];
        const tasks = Array.from(plan.tasks.values());
        // Check for circular dependencies
        if (this.hasCircularDependencies(tasks)) {
            errors.push('Circular dependency detected in task graph.');
        }
        // Check if every task has an assigned agent
        for (const task of tasks) {
            if (!task.agentId) {
                errors.push(`Task '${task.id}' has no assigned agent and no suitable match found.`);
            }
        }
        if (errors.length > 0) {
            this.emit(RuntimeEventType.VALIDATION_FAILED, { errors });
        }
        return {
            valid: errors.length === 0,
            errors: errors.length > 0 ? errors : undefined,
        };
    }
    /**
     * Strategic logic to break a goal into a sequence of tasks.
     * For Sprint 6.2, we use deterministic logic for specific patterns.
     */
    async decomposeGoal(goal) {
        // This is where the LLM integration will live in future sprints.
        // For now, we simulate decomposition based on keywords.
        const tasks = [];
        if (goal.toLowerCase().includes('report')) {
            tasks.push({
                id: 'research-task',
                type: TaskType.SEQUENTIAL,
                objective: 'Gather data for the report',
                role: 'knowledge-manager',
                dependencies: [],
                requiredCapabilities: ['research'],
            });
            tasks.push({
                id: 'draft-task',
                type: TaskType.SEQUENTIAL,
                objective: 'Draft the report document',
                role: 'project-manager',
                dependencies: ['research-task'],
                requiredCapabilities: ['writing'],
            });
            tasks.push({
                id: 'approval-task',
                type: TaskType.APPROVAL,
                objective: 'Review and approve report',
                role: 'chief-of-staff',
                dependencies: ['draft-task'],
            });
        }
        else {
            // Default fallback task
            tasks.push({
                id: 'general-task',
                type: TaskType.SEQUENTIAL,
                objective: `Address goal: ${goal}`,
                role: 'receptionist',
                dependencies: [],
            });
        }
        tasks.forEach(t => this.emit(RuntimeEventType.TASK_GENERATED, { taskId: t.id }));
        return tasks;
    }
    /**
     * Matches a task to the best available agent in the registry.
     */
    selectAgent(task) {
        const suitableAgents = this.registry.listAgentsByRole(task.role);
        // Filter by capabilities if specified
        const matched = suitableAgents.filter(agent => {
            if (!task.requiredCapabilities)
                return true;
            const agentCaps = agent.capabilities || [];
            return task.requiredCapabilities.every(req => agentCaps.includes(req));
        });
        // Filter by tools if specified
        const finalMatched = matched.filter(agent => {
            if (!task.requiredTools)
                return true;
            const agentMetadata = agent.metadata || {};
            const agentTools = agentMetadata.tools || [];
            return task.requiredTools.every(req => agentTools.includes(req));
        });
        if (finalMatched.length > 0) {
            // Simple selection: take the first matched agent
            task.agentId = finalMatched[0].id;
            this.emit(RuntimeEventType.AGENT_SELECTED, { taskId: task.id, agentId: task.agentId });
        }
        else {
            this.logger.warn(`No suitable agent found for task ${task.id} (Role: ${task.role})`);
        }
    }
    /**
     * Ensures every task dependency exists in the list.
     */
    resolveDependencies(tasks) {
        const ids = new Set(tasks.map(t => t.id));
        for (const task of tasks) {
            for (const dep of task.dependencies) {
                if (!ids.has(dep)) {
                    throw new RuntimeError(`Unresolved dependency: Task '${task.id}' depends on missing task '${dep}'`);
                }
                this.emit(RuntimeEventType.DEPENDENCY_CREATED, { from: task.id, to: dep });
            }
        }
    }
    /**
     * Circular dependency detection using Depth First Search.
     */
    hasCircularDependencies(tasks) {
        const adj = new Map();
        tasks.forEach(t => adj.set(t.id, t.dependencies));
        const visited = new Set();
        const recStack = new Set();
        const check = (v) => {
            if (!visited.has(v)) {
                visited.add(v);
                recStack.add(v);
                const neighbors = adj.get(v) || [];
                for (const neighbor of neighbors) {
                    if (!visited.has(neighbor) && check(neighbor))
                        return true;
                    if (recStack.has(neighbor))
                        return true;
                }
            }
            recStack.delete(v);
            return false;
        };
        for (const task of tasks) {
            if (check(task.id))
                return true;
        }
        return false;
    }
    emit(type, payload) {
        if (this.eventEmitter) {
            this.eventEmitter.emit(type, new RuntimeEvent(type, payload));
        }
    }
};
PlanningEngine = PlanningEngine_1 = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [Object, EventEmitter2])
], PlanningEngine);
export { PlanningEngine };
//# sourceMappingURL=planning-engine.js.map