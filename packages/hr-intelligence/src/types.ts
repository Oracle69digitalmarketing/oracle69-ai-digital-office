export enum EmployeeStatus {
  ONBOARDING = "onboarding",
  ACTIVE = "active",
  OFFBOARDING = "offboarding",
  INACTIVE = "inactive",
}

export enum PositionStatus {
  OPEN = "open",
  CLOSED = "closed",
  FILLED = "filled",
}

export enum EmploymentType {
  FULL_TIME = "full_time",
  PART_TIME = "part_time",
  CONTRACT = "contract",
}

export enum CandidateStage {
  APPLIED = "applied",
  SCREENING = "screening",
  INTERVIEWING = "interviewing",
  OFFER = "offer",
  HIRED = "hired",
  REJECTED = "rejected",
}

export interface HrEmployee {
  id: string;
  fullName: string;
  email: string;
  department: string;
  title: string;
  status: EmployeeStatus;
  hireDate: string;
  terminationDate?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HrPosition {
  id: string;
  title: string;
  department: string;
  employmentType: EmploymentType;
  status: PositionStatus;
  location?: string;
  description?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

export interface HrCandidate {
  id: string;
  positionId: string;
  name: string;
  email: string;
  stage: CandidateStage;
  appliedAt: string;
  offeredAt?: string;
  hiredAt?: string;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
}

/** Workforce and recruitment metrics derived from the persisted HR records. */
export interface HrKpis {
  headcount: number;
  activeHeadcount: number;
  onboardingCount: number;
  offboardingCount: number;
  turnoverCount: number;
  turnoverRate: number;
  openPositions: number;
  filledPositions: number;
  candidatesInPipeline: number;
  hiredCandidates: number;
  offerAcceptanceRate: number;
  averageTimeToHireDays: number;
}

/** Workforce health snapshot combining KPIs and recruitment exposure. */
export interface HrHealth {
  score: number;
  status: "healthy" | "at_risk" | "critical";
  kpis: HrKpis;
  openPositions: number;
  candidatesInPipeline: number;
  reasoning: string[];
}

export interface HrAiInsight {
  type: "forecast" | "recommendation" | "alert";
  title: string;
  content: string;
  priority: "low" | "normal" | "high";
  impact?: string;
}
