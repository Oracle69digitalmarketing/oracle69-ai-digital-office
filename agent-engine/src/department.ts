export interface Department {
  id: string;
  name: string;
  promptReference: string;
  capabilities: string[];
  kpis: string[];
  escalationPath: string;
}

export interface DepartmentManifest extends Department {
  agentClass?: any; // Reference to the agent class constructor if available
}
