import { Global, Module } from "@nestjs/common";
import { PersistenceModule } from "../persistence/persistence.module.js";
import { EventBus } from "./event-bus.js";
import { EventCatalogService } from "./event-catalog.js";
import { EventLogWriter } from "./event-log-writer.js";

/**
 * Provides the canonical {@link EventBus}, {@link EventCatalogService} and the
 * persistent {@link EventLogWriter} as global, singleton event infrastructure
 * for the Enterprise Runtime and every consuming module.
 */
@Global()
@Module({
  imports: [PersistenceModule],
  providers: [EventBus, EventCatalogService, EventLogWriter],
  exports: [EventBus, EventCatalogService],
})
export class EventsModule {}
