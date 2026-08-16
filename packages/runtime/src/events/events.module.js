var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Global, Module } from '@nestjs/common';
import { PersistenceModule } from '../persistence/persistence.module.js';
import { EventBus } from './event-bus.js';
import { EventCatalogService } from './event-catalog.js';
import { EventLogWriter } from './event-log-writer.js';
/**
 * Provides the canonical {@link EventBus}, {@link EventCatalogService} and the
 * persistent {@link EventLogWriter} as global, singleton event infrastructure
 * for the Enterprise Runtime and every consuming module.
 */
let EventsModule = class EventsModule {
};
EventsModule = __decorate([
    Global(),
    Module({
        imports: [PersistenceModule],
        providers: [EventBus, EventCatalogService, EventLogWriter],
        exports: [EventBus, EventCatalogService],
    })
], EventsModule);
export { EventsModule };
