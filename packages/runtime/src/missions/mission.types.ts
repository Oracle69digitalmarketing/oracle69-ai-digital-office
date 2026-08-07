export enum MissionStatus {
  DRAFT = 'draft',
  APPROVED = 'approved',
  PLANNED = 'planned',
  SCHEDULED = 'scheduled',
  RUNNING = 'running',
  PAUSED = 'paused',
  WAITING_FOR_APPROVAL = 'waiting_for_approval',
  RETRYING = 'retrying',
  RECOVERED = 'recovered',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  FAILED = 'failed',
  ARCHIVED = 'archived',
}

export interface Mission {
  id: string;
  goal: string;
  priority: 'low' | 'normal' | 'high' | 'critical';
  deadline: string;
  owner: string;
  status: MissionStatus;
  workflowId?: string;
  planId?: string;
}

export interface IMissionManager {
  createMission(mission: Mission): Promise<void>;
  startMission(missionId: string): Promise<void>;
}
