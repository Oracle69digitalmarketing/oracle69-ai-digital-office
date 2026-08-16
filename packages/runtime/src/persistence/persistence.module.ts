import { Global, Module } from "@nestjs/common";
import type { PrismaClient } from "@prisma/client";
import {
  InMemoryMissionRepository,
  PrismaMissionRepository,
  MISSION_REPOSITORY,
} from "./mission.repository.js";
import {
  InMemoryCheckpointRepository,
  PrismaCheckpointRepository,
  CHECKPOINT_REPOSITORY,
} from "./checkpoint.repository.js";
import {
  InMemoryDeploymentRepository,
  PrismaDeploymentRepository,
  DEPLOYMENT_REPOSITORY,
} from "./deployment.repository.js";
import { DeploymentService } from "./deployment.service.js";
import { TenantContextService } from "../tenancy/tenant-context.js";
import { InMemoryEventLog, PrismaEventLog, EVENT_LOG } from "../events/event-log.js";

/**
 * Provides the durable persistence contracts for the Enterprise Runtime.
 *
 * When a `PrismaService` (from the backend's global `PrismaModule`) is
 * available, the Prisma-backed repositories are used and all runtime state is
 * persisted durably across process restarts. Otherwise, in-memory
 * implementations provide the same tenant-scoped contracts for tests and
 * standalone runtimes.
 */
@Global()
@Module({
  providers: [
    TenantContextService,
    DeploymentService,
    {
      provide: MISSION_REPOSITORY,
      useFactory: (prisma?: PrismaClient) =>
        prisma ? new PrismaMissionRepository(prisma) : new InMemoryMissionRepository(),
      inject: [{ token: "PrismaService", optional: true }],
    },
    {
      provide: CHECKPOINT_REPOSITORY,
      useFactory: (prisma?: PrismaClient) =>
        prisma ? new PrismaCheckpointRepository(prisma) : new InMemoryCheckpointRepository(),
      inject: [{ token: "PrismaService", optional: true }],
    },
    {
      provide: DEPLOYMENT_REPOSITORY,
      useFactory: (prisma?: PrismaClient) =>
        prisma ? new PrismaDeploymentRepository(prisma) : new InMemoryDeploymentRepository(),
      inject: [{ token: "PrismaService", optional: true }],
    },
    {
      provide: EVENT_LOG,
      useFactory: (prisma?: PrismaClient) =>
        prisma ? new PrismaEventLog(prisma) : new InMemoryEventLog(),
      inject: [{ token: "PrismaService", optional: true }],
    },
  ],
  exports: [
    TenantContextService,
    DeploymentService,
    MISSION_REPOSITORY,
    CHECKPOINT_REPOSITORY,
    DEPLOYMENT_REPOSITORY,
    EVENT_LOG,
  ],
})
export class PersistenceModule {}
