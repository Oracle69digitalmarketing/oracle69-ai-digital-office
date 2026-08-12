import { EventBus, EventCatalogService, TenantContextService } from '@oracle69/runtime';
import { EmployeeService } from '../services/employee.service.js';
import { RecruitmentService } from '../services/recruitment.service.js';
import { HrKpiService } from '../services/hr-kpi.service.js';
import { HrHealthService } from '../services/hr-health.service.js';
import { HrAiService } from '../services/hr-ai.service.js';
import { EmployeeRepository, HR_EMPLOYEE_REPOSITORY, InMemoryEmployeeRepository } from '../repositories/employee.repository.js';
import { PositionRepository, HR_POSITION_REPOSITORY, InMemoryPositionRepository } from '../repositories/position.repository.js';
import { CandidateRepository, HR_CANDIDATE_REPOSITORY, InMemoryCandidateRepository } from '../repositories/candidate.repository.js';

export interface HrTestContext {
  employeeService: EmployeeService;
  recruitmentService: RecruitmentService;
  kpiService: HrKpiService;
  healthService: HrHealthService;
  aiService: HrAiService;
  eventBus: EventBus;
  catalog: EventCatalogService;
  tenantContext: TenantContextService;
  events: Array<{ type: string; payload: unknown; tenantId?: string }>;
  close(): void;
}

/**
 * Builds the HR Intelligence services wired with the canonical (real) EventBus,
 * EventCatalogService and TenantContextService plus in-memory repositories.
 * Every published event is captured in `events` for assertion.
 */
export function createHrTestModule(): HrTestContext {
  const events: Array<{ type: string; payload: unknown; tenantId?: string }> = [];
  const catalog = new EventCatalogService();
  const tenantContext = new TenantContextService();
  const eventBus = new EventBus(catalog, tenantContext);
  eventBus.allEvents().subscribe((event) => {
    events.push({ type: event.type, payload: event.payload, tenantId: event.tenantId });
  });

  const employeeRepo: EmployeeRepository = new InMemoryEmployeeRepository();
  const positionRepo: PositionRepository = new InMemoryPositionRepository();
  const candidateRepo: CandidateRepository = new InMemoryCandidateRepository();

  const employeeService = new EmployeeService(employeeRepo, eventBus, tenantContext);
  const recruitmentService = new RecruitmentService(positionRepo, candidateRepo, employeeService, eventBus, tenantContext);
  const kpiService = new HrKpiService(employeeRepo, positionRepo, candidateRepo, tenantContext);
  const healthService = new HrHealthService(kpiService);
  const aiService = new HrAiService(undefined as never);

  return {
    employeeService,
    recruitmentService,
    kpiService,
    healthService,
    aiService,
    eventBus,
    catalog,
    tenantContext,
    events,
    close() {
      eventBus.complete();
    },
  };
}

export { HR_EMPLOYEE_REPOSITORY, HR_POSITION_REPOSITORY, HR_CANDIDATE_REPOSITORY };
