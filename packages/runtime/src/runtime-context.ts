import { v4 as uuidv4 } from 'uuid';
import { IRuntimeContext } from './runtime.types.js';

/**
 * Implementation of the Runtime Context for cross-system correlation and state management.
 */
export class RuntimeContext implements IRuntimeContext {
  public readonly traceId: string;
  public readonly startTime: string;
  private readonly state = new Map<string, any>();

  constructor(
    public readonly taskId: string,
    public readonly orgId: string,
    initialMetadata: Record<string, any> = {}
  ) {
    this.traceId = uuidv4();
    this.startTime = new Date().toISOString();
    
    // Seed initial metadata
    Object.entries(initialMetadata).forEach(([key, value]) => {
      this.state.set(key, value);
    });
  }

  /**
   * Retrieves a value from the context metadata.
   */
  public get(key: string): any {
    return this.state.get(key);
  }

  /**
   * Updates a value in the context metadata.
   */
  public set(key: string, value: any): void {
    this.state.set(key, value);
  }
}
