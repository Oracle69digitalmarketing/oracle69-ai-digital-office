/**
 * Provides the durable persistence contracts for the Enterprise Runtime.
 *
 * When a `PrismaService` (from the backend's global `PrismaModule`) is
 * available, the Prisma-backed repositories are used and all runtime state is
 * persisted durably across process restarts. Otherwise, in-memory
 * implementations provide the same tenant-scoped contracts for tests and
 * standalone runtimes.
 */
export declare class PersistenceModule {}
//# sourceMappingURL=persistence.module.d.ts.map
