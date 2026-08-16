import { Module } from "@nestjs/common";
import { ExecutiveOffice } from "./executive-office.js";
import { ExecutiveRegistry } from "./executive-registry.js";
import { ExecutiveCoordinator } from "./executive-coordinator.js";

@Module({
  providers: [ExecutiveOffice, ExecutiveRegistry, ExecutiveCoordinator],
  exports: [ExecutiveOffice, ExecutiveRegistry, ExecutiveCoordinator],
})
export class ExecutiveModule {}
