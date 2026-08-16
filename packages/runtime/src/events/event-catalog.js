var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
import { Injectable } from '@nestjs/common';
import { RuntimeEventType } from './runtime.events.js';
/**
 * Category grouping of canonical runtime events.
 */
export var EventCategory;
(function (EventCategory) {
    EventCategory["RUNTIME"] = "runtime";
    EventCategory["AGENT"] = "agent";
    EventCategory["PLANNING"] = "planning";
    EventCategory["WORKFLOW"] = "workflow";
    EventCategory["TOOL"] = "tool";
    EventCategory["MISSION"] = "mission";
    EventCategory["MEMORY"] = "memory";
    EventCategory["OBSERVABILITY"] = "observability";
    EventCategory["GOVERNANCE"] = "governance";
    EventCategory["COMMUNICATION"] = "communication";
    EventCategory["EXECUTIVE"] = "executive";
    EventCategory["DOMAIN"] = "domain";
})(EventCategory || (EventCategory = {}));
/**
 * The authoritative event catalog for the Enterprise Runtime.
 *
 * Complements the {@link RuntimeEventType} vocabulary with human-readable
 * descriptions and category grouping. The catalog is derived from the enum
 * values so the vocabulary and the catalog can never drift apart. Domain
 * events are registered through {@link EventCatalog.registerDomainType}.
 */
export class EventCatalog {
    entries = new Map();
    constructor() {
        this.seed();
    }
    /**
     * Registers a single canonical event entry.
     */
    register(entry) {
        this.entries.set(entry.type, entry);
    }
    /**
     * Seeds the catalog from the canonical {@link RuntimeEventType} vocabulary.
     */
    seed() {
        const categorized = [
            [RuntimeEventType.RUNTIME_STARTED, 'The Enterprise Runtime has started booting.', EventCategory.RUNTIME],
            [RuntimeEventType.RUNTIME_READY, 'The Enterprise Runtime is ready to serve.', EventCategory.RUNTIME],
            [RuntimeEventType.RUNTIME_SHUTDOWN, 'The Enterprise Runtime has shut down.', EventCategory.RUNTIME],
            [RuntimeEventType.RUNTIME_ERROR, 'The Enterprise Runtime encountered an unrecoverable error.', EventCategory.RUNTIME],
            [RuntimeEventType.RUNTIME_WARNING, 'The Enterprise Runtime recorded a non-fatal warning.', EventCategory.RUNTIME],
            [RuntimeEventType.AGENT_REGISTERED, 'An AI agent was registered with the registry.', EventCategory.AGENT],
            [RuntimeEventType.AGENT_LOADED, 'An AI agent was resolved and loaded.', EventCategory.AGENT],
            [RuntimeEventType.AGENT_LOOKUP, 'An AI agent lookup was performed.', EventCategory.AGENT],
            [RuntimeEventType.AGENT_VALIDATION_FAILED, 'An AI agent definition failed schema validation.', EventCategory.AGENT],
            [RuntimeEventType.PLANNING_STARTED, 'A plan began to be generated for a goal.', EventCategory.PLANNING],
            [RuntimeEventType.PLANNING_COMPLETED, 'A plan was generated successfully.', EventCategory.PLANNING],
            [RuntimeEventType.PLANNING_FAILED, 'Plan generation failed.', EventCategory.PLANNING],
            [RuntimeEventType.TASK_GENERATED, 'A task was generated from a goal decomposition.', EventCategory.PLANNING],
            [RuntimeEventType.AGENT_SELECTED, 'An agent was selected for a task.', EventCategory.PLANNING],
            [RuntimeEventType.DEPENDENCY_CREATED, 'A task dependency was resolved.', EventCategory.PLANNING],
            [RuntimeEventType.VALIDATION_FAILED, 'Plan validation failed.', EventCategory.PLANNING],
            [RuntimeEventType.WORKFLOW_CREATED, 'A workflow instance was created.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_STARTED, 'A workflow instance started executing.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_PAUSED, 'A workflow instance was paused.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_RESUMED, 'A paused workflow instance resumed.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_COMPLETED, 'A workflow instance completed.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_FAILED, 'A workflow instance failed.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_CANCELLED, 'A workflow instance was cancelled.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_CHECKPOINT_SAVED, 'A workflow checkpoint was persisted.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_RETRY_STARTED, 'A workflow step began a retry.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_RETRY_COMPLETED, 'A workflow step retry completed.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_COMPENSATION_STARTED, 'Compensation began for a failed workflow step.', EventCategory.WORKFLOW],
            [RuntimeEventType.WORKFLOW_COMPENSATION_COMPLETED, 'Compensation completed for a failed workflow step.', EventCategory.WORKFLOW],
            [RuntimeEventType.TOOL_EXECUTION_STARTED, 'A tool execution started.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_EXECUTION_COMPLETED, 'A tool execution completed.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_EXECUTION_FAILED, 'A tool execution failed.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_VALIDATION_FAILED, 'A tool invocation failed validation.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_PERMISSION_DENIED, 'A tool invocation was denied by policy.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_CONNECTOR_SELECTED, 'A connector was selected for a tool invocation.', EventCategory.TOOL],
            [RuntimeEventType.TOOL_CREDENTIALS_LOADED, 'Credentials were loaded for a connector.', EventCategory.TOOL],
            [RuntimeEventType.MISSION_CREATED, 'A mission was created and persisted.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_APPROVED, 'A mission was approved.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_STARTED, 'A mission started executing.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_PAUSED, 'A mission was paused.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_RESUMED, 'A paused mission resumed.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_COMPLETED, 'A mission completed.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_CANCELLED, 'A mission was cancelled.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_FAILED, 'A mission failed.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_RETRY_STARTED, 'A mission began a retry.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_RETRY_COMPLETED, 'A mission retry completed.', EventCategory.MISSION],
            [RuntimeEventType.MISSION_RECOVERED, 'An interrupted mission recovered after restart.', EventCategory.MISSION],
            [RuntimeEventType.CHECKPOINT_CREATED, 'A mission checkpoint was persisted.', EventCategory.MISSION],
            [RuntimeEventType.CHECKPOINT_RESTORED, 'A mission checkpoint was restored.', EventCategory.MISSION],
            [RuntimeEventType.MEMORY_CREATED, 'A memory record was created.', EventCategory.MEMORY],
            [RuntimeEventType.MEMORY_UPDATED, 'A memory record was updated.', EventCategory.MEMORY],
            [RuntimeEventType.MEMORY_RETRIEVED, 'A memory record was retrieved.', EventCategory.MEMORY],
            [RuntimeEventType.MEMORY_INDEXED, 'Memory was indexed for retrieval.', EventCategory.MEMORY],
            [RuntimeEventType.CONTEXT_LOADED, 'A runtime context was loaded.', EventCategory.MEMORY],
            [RuntimeEventType.CONTEXT_COMPRESSED, 'A runtime context was compressed.', EventCategory.MEMORY],
            [RuntimeEventType.RUNTIME_HEALTH_CHANGED, 'Runtime health changed.', EventCategory.OBSERVABILITY],
            [RuntimeEventType.RUNTIME_METRIC_RECORDED, 'A runtime metric was recorded.', EventCategory.OBSERVABILITY],
            [RuntimeEventType.RUNTIME_TRACE_STARTED, 'A distributed trace started.', EventCategory.OBSERVABILITY],
            [RuntimeEventType.RUNTIME_TRACE_COMPLETED, 'A distributed trace completed.', EventCategory.OBSERVABILITY],
            [RuntimeEventType.AUDIT_ENTRY_CREATED, 'An audit entry was recorded.', EventCategory.OBSERVABILITY],
        ];
        for (const [type, description, category] of categorized) {
            this.register({ type, description, category });
        }
    }
    /**
     * Registers a domain-specific event type that extends the canonical
     * vocabulary. Domain events keep flowing through the same canonical
     * pipeline while becoming visible to the catalog.
     */
    registerDomainType(type, description, category = EventCategory.DOMAIN) {
        this.register({ type, description, category });
    }
    /**
     * Returns the catalog entry for a canonical event type, if known.
     */
    entry(type) {
        return this.entries.get(type);
    }
    /**
     * Returns whether the given type is a known canonical event type.
     */
    isCanonical(type) {
        return this.entries.has(type);
    }
    /**
     * Returns every catalogued event entry.
     */
    entriesAll() {
        return Array.from(this.entries.values());
    }
    /**
     * Returns every event type catalogue known by this catalog.
     */
    types() {
        return Array.from(this.entries.keys());
    }
}
/**
 * Injectable wrapper exposing the canonical {@link EventCatalog} through the
 * Nest dependency injection container.
 */
let EventCatalogService = class EventCatalogService {
    catalog;
    constructor() {
        this.catalog = new EventCatalog();
    }
    entry(type) {
        return this.catalog.entry(type);
    }
    isCanonical(type) {
        return this.catalog.isCanonical(type);
    }
    registerDomainType(type, description, category = EventCategory.DOMAIN) {
        this.catalog.registerDomainType(type, description, category);
    }
    types() {
        return this.catalog.types();
    }
    entriesAll() {
        return this.catalog.entriesAll();
    }
};
EventCatalogService = __decorate([
    Injectable(),
    __metadata("design:paramtypes", [])
], EventCatalogService);
export { EventCatalogService };
