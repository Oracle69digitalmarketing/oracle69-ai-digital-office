import { Module, Provider } from "@nestjs/common";
import { EmployeeService } from "./services/employee.service.js";
import { RecruitmentService } from "./services/recruitment.service.js";
import { HrKpiService } from "./services/hr-kpi.service.js";
import { HrHealthService } from "./services/hr-health.service.js";
import { HrAiService } from "./services/hr-ai.service.js";
import {
  HR_EMPLOYEE_REPOSITORY,
  PrismaEmployeeRepository,
} from "./repositories/employee.repository.js";
import {
  HR_POSITION_REPOSITORY,
  PrismaPositionRepository,
} from "./repositories/position.repository.js";
import {
  HR_CANDIDATE_REPOSITORY,
  PrismaCandidateRepository,
} from "./repositories/candidate.repository.js";
import { HrController } from "./controllers/hr.controller.js";
import { RuntimeModule, EventCatalogService, EventCategory } from "@oracle69/runtime";
import { GeminiModelProvider } from "@oracle69/sales-intelligence";
import { HrEventType } from "./events/hr.events.js";

const Repositories: Provider[] = [
  {
    provide: HR_EMPLOYEE_REPOSITORY,
    useClass: PrismaEmployeeRepository,
  },
  {
    provide: HR_POSITION_REPOSITORY,
    useClass: PrismaPositionRepository,
  },
  {
    provide: HR_CANDIDATE_REPOSITORY,
    useClass: PrismaCandidateRepository,
  },
];

@Module({
  imports: [RuntimeModule],
  controllers: [HrController],
  providers: [
    ...Repositories,
    EmployeeService,
    RecruitmentService,
    HrKpiService,
    HrHealthService,
    HrAiService,
    {
      provide: "AiModelProvider",
      useFactory: () => new GeminiModelProvider(process.env.GOOGLE_AI_API_KEY || ""),
    },
  ],
  exports: [
    EmployeeService,
    RecruitmentService,
    HrKpiService,
    HrHealthService,
    HrAiService,
    ...Repositories,
  ],
})
export class HrIntelligenceModule {
  constructor(private readonly eventCatalog: EventCatalogService) {
    this.eventCatalog.registerDomainType(
      HrEventType.EMPLOYEE_HIRED,
      "A new employee was hired and onboarded.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.EMPLOYEE_UPDATED,
      "An employee record was updated.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.EMPLOYEE_OFFBOARDED,
      "An employee was offboarded.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.POSITION_CREATED,
      "A new job position was opened.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.POSITION_CLOSED,
      "A job position was closed.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.CANDIDATE_CREATED,
      "A candidate applied to a position.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.CANDIDATE_STAGE_UPDATED,
      "A candidate advanced to a new recruitment stage.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.CANDIDATE_HIRED,
      "A candidate was hired.",
      EventCategory.EXECUTIVE,
    );
    this.eventCatalog.registerDomainType(
      HrEventType.INSIGHT_GENERATED,
      "Workforce intelligence insights were generated.",
      EventCategory.EXECUTIVE,
    );
  }
}
