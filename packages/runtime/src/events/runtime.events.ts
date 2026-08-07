import { IRuntimeEvent } from '../runtime.types.js';

/**
 * Enumeration of all runtime event types.
 */
export enum RuntimeEventType {
  RUNTIME_STARTED = 'runtime.started',
  RUNTIME_READY = 'runtime.ready',
  RUNTIME_SHUTDOWN = 'runtime.shutdown',
  AGENT_REGISTERED = 'agent.registered',
  AGENT_LOADED = 'agent.loaded',
  AGENT_LOOKUP = 'agent.lookup',
  AGENT_VALIDATION_FAILED = 'agent.validation.failed',
  RUNTIME_ERROR = 'runtime.error',
  RUNTIME_WARNING = 'runtime.warning',
  
  // Planning Events
  PLANNING_STARTED = 'planning.started',
  PLANNING_COMPLETED = 'planning.completed',
  PLANNING_FAILED = 'planning.failed',
  TASK_GENERATED = 'task.generated',
  AGENT_SELECTED = 'agent.selected',
  DEPENDENCY_CREATED = 'dependency.created',
  VALIDATION_FAILED = 'validation.failed',
}

/**
 * Concrete implementation of a runtime event.
 */
export class RuntimeEvent implements IRuntimeEvent {
  public readonly timestamp: number;

  constructor(
    public readonly type: RuntimeEventType | string,
    public readonly payload: any = {}
  ) {
    this.timestamp = Date.now();
  }
}
