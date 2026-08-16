# Sprint 6.1 Runtime Foundation

## 1. Sprint Objective

The objective of Sprint 6.1 is to establish the **Runtime Foundation**, the bedrock upon which the entire Enterprise Runtime will be built. This foundational layer provides the lifecycle management, agent discovery, and communication protocols (Events & Errors) required for all higher-level components like the Planning and Workflow Engines.

Starting with the foundation ensures that:

- Every agent is registered and validated before execution.
- All execution attempts have a standardized `RuntimeContext`.
- System-wide observability begins at the moment of initialization.
- Decoupling is enforced from day one through strict interface-based design.

---

## 2. Scope

### INCLUDED

- **Runtime Manager**: The central supervisor responsible for starting, stopping, and monitoring the runtime environment.
- **Agent Registry**: A specialized directory for discovering and validating AI agents based on their metadata and capabilities.
- **Runtime Context**: The data structure that carries execution-specific state, identifiers, and metadata throughout the lifecycle.
- **Runtime Types**: Foundational TypeScript interfaces and types for the package.
- **Runtime Events**: The internal event catalog and publication mechanism.
- **Runtime Errors**: A hierarchical error system specifically for runtime failures.
- **Runtime package bootstrap**: Initial setup of the `packages/runtime/` environment (metadata only).
- **Unit tests**: Full Jest coverage for all implemented modules.

### EXCLUDED (Explicitly)

- **Planning Engine**: No goal decomposition or reasoning logic.
- **Workflow Engine**: No state machines, DAG management, or persistence.
- **Tool Router**: No bridging to Phase 5 connectors.
- **Memory Manager**: No integration with databases or vector stores.
- **Connectors**: No implementation or usage of external system adapters.
- **Scheduler**: No time-triggered or recurring task logic.
- **API endpoints**: No REST controllers or external gateway implementation.
- **UI**: No frontend components or dashboard integration.
- **Authentication**: No JWT or Supabase integration at this layer.
- **Persistence**: No database schema modifications or Prisma storage logic.

---

## 3. Package Structure

```
packages/runtime/
├── src/
│   ├── runtime-manager.ts     # IRuntimeManager implementation
│   ├── agent-registry.ts      # IAgentRegistry implementation
│   ├── runtime-context.ts     # IRuntimeContext implementation
│   ├── runtime.types.ts       # Shared interfaces and types
│   ├── events/
│   │   └── runtime.events.ts  # Event catalog and types
│   ├── errors/
│   │   └── runtime.errors.ts  # Error hierarchy and classes
│   └── index.ts               # Public entry point
└── tests/
    ├── runtime-manager.spec.ts
    ├── agent-registry.spec.ts
    ├── runtime-context.spec.ts
    └── runtime.events.spec.ts
```

---

## 4. Component Responsibilities

### RuntimeManager

- **Purpose**: Global supervisor for the Enterprise Runtime.
- **Responsibilities**:
  - Manage the `started`/`stopped`/`ready` lifecycle states.
  - Orchestrate the initialization of the Agent Registry.
  - Serve as the primary entry point for spawning execution contexts.
- **Public Methods**: `initialize()`, `shutdown()`, `createContext(taskId, orgId)`, `getStatus()`.
- **Lifecycle**: Controls transitions from `Uninitialized` -> `Starting` -> `Ready` -> `Stopping` -> `Stopped`.

### AgentRegistry

- **Purpose**: Source of truth for all available digital employees.
- **Responsibilities**:
  - Store and retrieve `AgentMetadata` (role, department, version).
  - Validate agent definitions against the platform schema.
  - Prevent duplicate registrations of the same agent ID.
- **Registration Process**: Validates metadata -> Checks for conflicts -> Stores in memory map -> Publishes `agent.registered`.
- **Lookup Process**: Retrieves agent by ID or Role; returns `NotFoundError` if missing.
- **Validation Rules**: Mandatory fields (id, name, role, version); semantic versioning check.

### RuntimeContext

- **Context Lifecycle**: Created at the start of a workflow or task; immutable after initialization (except for state updates).
- **Stored State**: `traceId`, `orgId`, `taskId`, `startTime`, `metadata`.
- **Metadata**: Key-value store for execution-specific flags (e.g., `debugMode`, `priority`).
- **Execution Identifiers**: Universally unique identifiers used for cross-component tracing.

### Runtime Events

- **Event Catalog**: Central registry of all internal events.
- **Mechanism**: Integration with an internal `EventEmitter` or `EventBus` bridge.

### Runtime Errors

- **Error Hierarchy**: Base `RuntimeError` extending native `Error`.
- **Specific Errors**: `InitializationError`, `RegistryConflictError`, `AgentNotFoundError`, `ContextCreationError`.

---

## 5. Public Interfaces

### IRuntimeManager

- `initialize(): Promise<void>`: Bootstraps the runtime and internal services.
- `shutdown(): Promise<void>`: Gracefully terminates active processes.
- `createContext(taskId: string, orgId: string): IRuntimeContext`: Factory for execution contexts.
- `getRegistry(): IAgentRegistry`: Provides access to the agent directory.

### IAgentRegistry

- `register(metadata: AgentMetadata): void`: Adds an agent to the system.
- `getAgent(id: string): AgentMetadata`: Retrieves an agent by its unique identifier.
- `listAgentsByRole(role: string): AgentMetadata[]`: Discovery by department/role.
- `validate(metadata: AgentMetadata): boolean`: Schema and policy verification.

### IRuntimeContext

- `readonly traceId: string`: Cross-system correlation ID.
- `readonly orgId: string`: Multi-tenant isolation ID.
- `get(key: string): any`: Retrieve context metadata.
- `set(key: string, value: any): void`: (Internal only) Update context state.

### IRuntimeEvent

- `readonly type: string`: Event identifier (e.g., `runtime.ready`).
- `readonly payload: any`: Event-specific data.
- `readonly timestamp: number`: Epoch time of emission.

### IRuntimeLifecycle

- `getState(): RuntimeState`: Returns current system status.
- `on(state: RuntimeState, callback: Function): void`: State transition listener.

---

## 6. Runtime Lifecycle

1. **Initialize Runtime**: `RuntimeManager.initialize()` is called. The internal state moves to `Starting`.
2. **Register Agent**: Application (or departments) calls `AgentRegistry.register()`.
3. **Validate Agent**: Registry checks metadata against schema. If invalid, `agent.validation.failed` is published.
4. **Create Runtime Context**: For every new task, `RuntimeManager.createContext()` generates a unique `traceId` and binds it to an `orgId`.
5. **Publish Runtime Event**: Components emit events (e.g., `agent.loaded`) to the internal bus.
6. **Shutdown Runtime**: `RuntimeManager.shutdown()` is called. State moves to `Stopping`, events are drained, and resources released. State ends at `Stopped`.

---

## 7. Event Flow

| Event                     | Emission Trigger                                                     |
| :------------------------ | :------------------------------------------------------------------- |
| `runtime.started`         | When `initialize()` begins.                                          |
| `runtime.ready`           | When all internal services are active.                               |
| `runtime.shutdown`        | When `shutdown()` is completed.                                      |
| `agent.registered`        | After successful metadata storage in Registry.                       |
| `agent.loaded`            | When an agent is first accessed in a session.                        |
| `agent.lookup`            | Every time `getAgent()` is called.                                   |
| `agent.validation.failed` | During registration if metadata is malformed.                        |
| `runtime.error`           | Any unhandled internal exception.                                    |
| `runtime.warning`         | For non-fatal issues (e.g., duplicate registration attempt ignored). |

---

## 8. Error Strategy

- **Recoverable Errors**: Errors that can be handled via retry (not applicable to this foundation sprint).
- **Fatal Errors**: `InitializationError` - stops the platform from booting.
- **Validation Failures**: Throw `RegistryValidationError` during registration; does not crash the runtime.
- **Registration Conflicts**: Throw `RegistryConflictError` if ID is already taken.
- **Unknown Agent**: Return `null` or throw `AgentNotFoundError` depending on strictness settings.
- **Expected Handling**: All errors must be wrapped in `RuntimeError` to ensure consistent stack traces and metadata.

---

## 9. Unit Testing Plan

### Coverage Goals

- **Lines**: 95%+
- **Branches**: 95%+
- **Functions**: 100%

### Test Scenarios

1. **RuntimeManager**:
   - Verify `initialize` correctly sets state to `Ready`.
   - Verify `shutdown` cleans up listeners.
   - Verify `createContext` produces unique trace IDs.
2. **AgentRegistry**:
   - Success: Register valid agent, retrieve by ID, retrieve by Role.
   - Failure: Register agent with missing `role`, register duplicate ID.
3. **RuntimeContext**:
   - Verify immutability of core IDs (traceId, orgId).
   - Verify metadata storage and retrieval.
4. **Events**:
   - Verify event emission when registry actions occur.
   - Verify runtime lifecycle event sequence.

---

## 10. Acceptance Criteria

- [ ] `packages/runtime/` package builds without errors using `tsc`.
- [ ] 100% of defined Jest tests pass.
- [ ] `AgentRegistry` correctly prevents registration of agents with duplicate IDs.
- [ ] `AgentRegistry` allows lookup of agents by both `id` and `role`.
- [ ] `RuntimeManager` transitions through all lifecycle states (`Starting` -> `Ready` -> `Stopping`).
- [ ] `RuntimeContext` correctly generates and stores a `traceId` (UUID).
- [ ] **Constraint Verification**: No files related to Planning, Workflow, or Tools exist in the package.
- [ ] **Constraint Verification**: No connection strings or database-specific code is present.

---

## 11. Dependencies

### Prerequisites

- `@oracle69/shared`: For shared types and utility functions.
- `EventBus`: Access to the system-wide event infrastructure.

### Downstream Modules

- **Execution Engine**: Will use `RuntimeManager` to spawn tasks.
- **Planning Engine**: Will use `AgentRegistry` to discover available departments.
- **Workflow Engine**: Will use `RuntimeContext` for state correlation.

---

## 12. Implementation Order

1. **Setup Types & Errors**: Define `runtime.types.ts` and `runtime.errors.ts`.
2. **AgentRegistry**: Implement the registry and its validation logic.
3. **RuntimeContext**: Implement the context factory and data structure.
4. **RuntimeManager**: Implement the lifecycle orchestration and status management.
5. **Events**: Implement the event publication logic across all components.
6. **Integration Tests**: Verify the lifecycle from `initialize` -> `register` -> `createContext`.

---

## 13. Risks

- **Registry Bloat**: Storing thousands of agents in memory. _Mitigation_: Implementation remains in-memory for MVP; persistence layer planned for Phase 7.
- **Context Overhead**: Attaching too much data to `RuntimeContext`. _Mitigation_: Strict typing and "Internal vs Public" data separation.
- **Sync Initialization**: `initialize()` blocking the main thread. _Mitigation_: Ensure all initialization steps are truly asynchronous and use `Promise.all` where appropriate.

---

## 14. Definition of Done

- [ ] **Documented**: Specification is approved and committed to `docs/sprints/`.
- [ ] **Contracted**: All interfaces are defined and exported.
- [ ] **Verified**: Test plan covers all edge cases identified in the Error Strategy.
- [ ] **Scoped**: Final code contains zero references to out-of-scope modules (Planning, Workflow).
- [ ] **Compliant**: Follows NestJS-compatible modular patterns where applicable.
