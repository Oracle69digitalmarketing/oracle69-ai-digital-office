import { Observable } from 'rxjs';
import { DomainEvent } from './types.js';
export declare class EventBus {
    private readonly logger;
    private readonly bus$;
    publish<T>(event: Omit<DomainEvent<T>, 'eventId' | 'timestamp'>): void;
    ofType<T>(type: string): Observable<DomainEvent<T>>;
    allEvents(): Observable<DomainEvent>;
}
//# sourceMappingURL=event-bus.d.ts.map