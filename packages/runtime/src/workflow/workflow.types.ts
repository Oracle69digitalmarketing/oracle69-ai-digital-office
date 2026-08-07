import { IRuntimeContext } from '../runtime.types.js';

export enum WorkflowState {
  CREATED = 'created',
  READY = 'ready',
  RUNNING = 'running',
  WAITING = 'waiting',
  PAUSED = 'paused',
  RETRYING = 'retrying',
  FAILED = 'failed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export interface WorkflowMetadata {
  id: string;
  planId: string;
  createdAt: string;
  updatedAt: string;
  state: WorkflowState;
}

export interface WorkflowInstance {
  metadata: WorkflowMetadata;
  context: IRuntimeContext;
  currentTaskIndex: number;
  checkpoint: string | null;
  retryCount: number;
}
