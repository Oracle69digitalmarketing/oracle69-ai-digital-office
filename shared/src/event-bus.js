var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var EventBus_1;
import { Injectable, Logger } from '@nestjs/common';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
let EventBus = EventBus_1 = class EventBus {
    logger = new Logger(EventBus_1.name);
    bus$ = new Subject();
    publish(event) {
        const fullEvent = {
            ...event,
            eventId: Math.random().toString(36).substring(7),
            timestamp: new Date(),
        };
        this.logger.debug(`Event Published: ${fullEvent.type} from ${fullEvent.source}`);
        this.bus$.next(fullEvent);
    }
    ofType(type) {
        return this.bus$.asObservable().pipe(filter((event) => event.type === type), map((event) => event));
    }
    allEvents() {
        return this.bus$.asObservable();
    }
};
EventBus = EventBus_1 = __decorate([
    Injectable()
], EventBus);
export { EventBus };
//# sourceMappingURL=event-bus.js.map