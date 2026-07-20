import { Injectable, Logger } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { DomainEvent } from './types.js';

@Injectable()
export class EventBus {
  private readonly logger = new Logger(EventBus.name);
  private readonly bus$ = new Subject<DomainEvent>();

  publish<T>(event: Omit<DomainEvent<T>, 'eventId' | 'timestamp'>) {
    const fullEvent: DomainEvent<T> = {
      ...event,
      eventId: Math.random().toString(36).substring(7),
      timestamp: new Date(),
    };
    
    this.logger.debug(`Event Published: ${fullEvent.type} from ${fullEvent.source}`);
    this.bus$.next(fullEvent);
  }

  ofType<T>(type: string): Observable<DomainEvent<T>> {
    return this.bus$.asObservable().pipe(
      filter((event: DomainEvent) => event.type === type),
      map((event: DomainEvent) => event as DomainEvent<T>)
    );
  }

  allEvents(): Observable<DomainEvent> {
    return this.bus$.asObservable();
  }
}
