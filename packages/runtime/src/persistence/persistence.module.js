var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { InMemoryMissionRepository, PrismaMissionRepository, MISSION_REPOSITORY, } from './mission.repository.js';
import { InMemoryCheckpointRepository, PrismaCheckpointRepository, CHECKPOINT_REPOSITORY, } from './checkpoint.repository.js';
import { InMemoryDeploymentRepository, PrismaDeploymentRepository, DEPLOYMENT_REPOSITORY, } from './deployment.repository.js';
import { DeploymentService } from './deployment.service.js';
import { TenantContextService } from '../tenancy/tenant-context.js';
import { InMemoryEventLog, PrismaEventLog, EVENT_LOG } from '../events/event-log.js';
/**
 * Provides the durable persistence contracts for the Enterprise Runtime.
 *
 * When a `PrismaService` (from the backend's global `PrismaModule`) is
 * available, the Prisma-backed repositories are used and all runtime state is
 * persisted durably across process restarts. Otherwise, in-memory
 * implementations provide the same tenant-scoped contracts for tests and
 * standalone runtimes.
 */
let PersistenceModule = class PersistenceModule {
};
PersistenceModule = __decorate([
    Global(),
    Module({
        providers: [
            TenantContextService,
            DeploymentService,
            {
                provide: MISSION_REPOSITORY,
                useFactory: (prisma) => prisma ? new PrismaMissionRepository(prisma) : new InMemoryMissionRepository(),
                inject: [{ token: 'PrismaService', optional: true }],
            },
            {
                provide: CHECKPOINT_REPOSITORY,
                useFactory: (prisma) => prisma ? new PrismaCheckpointRepository(prisma) : new InMemoryCheckpointRepository(),
                inject: [{ token: 'PrismaService', optional: true }],
            },
            {
                provide: DEPLOYMENT_REPOSITORY,
                useFactory: (prisma) => prisma ? new PrismaDeploymentRepository(prisma) : new InMemoryDeploymentRepository(),
                inject: [{ token: 'PrismaService', optional: true }],
            },
            {
                provide: EVENT_LOG,
                useFactory: (prisma) => (prisma ? new PrismaEventLog(prisma) : new InMemoryEventLog()),
                inject: [{ token: 'PrismaService', optional: true }],
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
], PersistenceModule);
export { PersistenceModule };
