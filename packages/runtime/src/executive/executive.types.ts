export interface ExecutiveMetadata {
  id: string;
  role: "CEO" | "COO" | "CTO" | "CFO" | "CMO" | "CHRO" | "ChiefOfStaff" | "LegalCounsel";
  departmentId: string;
}

export interface EnterpriseGoal {
  id: string;
  goal: string;
  priority: "low" | "normal" | "high" | "critical";
  deadline: string;
  status: "created" | "approved" | "failed" | "completed";
}

export interface IExecutiveOffice {
  assignEnterpriseGoal(goal: EnterpriseGoal): Promise<void>;
  approveMission(missionId: string): Promise<void>;
}
