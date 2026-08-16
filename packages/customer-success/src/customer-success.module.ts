import { Module, Global } from "@nestjs/common";
import { RuntimeModule } from "@oracle69/runtime";
import { CrmModule } from "@oracle69/crm";
import { SalesIntelligenceModule } from "@oracle69/sales-intelligence";
import { CustomerSuccessController } from "./controllers/cs.controller.js";
import { CsHealthEngine } from "./services/cs-health.engine.js";
import { CsRiskEngine } from "./services/cs-risk.engine.js";
import { CsSuccessPlanService } from "./services/cs-success-plan.service.js";

@Global()
@Module({
  imports: [RuntimeModule, CrmModule, SalesIntelligenceModule],
  controllers: [CustomerSuccessController],
  providers: [CsHealthEngine, CsRiskEngine, CsSuccessPlanService],
  exports: [CsHealthEngine, CsRiskEngine, CsSuccessPlanService],
})
export class CustomerSuccessModule {}
