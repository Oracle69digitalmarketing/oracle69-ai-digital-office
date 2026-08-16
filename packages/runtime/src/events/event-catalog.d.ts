/**
 * Category grouping of canonical runtime events.
 */
export declare enum EventCategory {
  RUNTIME = "runtime",
  AGENT = "agent",
  PLANNING = "planning",
  WORKFLOW = "workflow",
  TOOL = "tool",
  MISSION = "mission",
  MEMORY = "memory",
  OBSERVABILITY = "observability",
  GOVERNANCE = "governance",
  COMMUNICATION = "communication",
  EXECUTIVE = "executive",
  DOMAIN = "domain",
}
/**
 * Canonical entry describing a runtime event type.
 */
export interface EventCatalogEntry {
  /** Canonical event name (e.g., 'runtime.ready'). */
  readonly type: string;
  /** Human-readable description of the event. */
  readonly description: string;
  /** Category the event belongs to. */
  readonly category: EventCategory;
}
/**
 * The authoritative event catalog for the Enterprise Runtime.
 *
 * Complements the {@link RuntimeEventType} vocabulary with human-readable
 * descriptions and category grouping. The catalog is derived from the enum
 * values so the vocabulary and the catalog can never drift apart. Domain
 * events are registered through {@link EventCatalog.registerDomainType}.
 */
export declare class EventCatalog {
  private readonly entries;
  constructor();
  /**
   * Registers a single canonical event entry.
   */
  private register;
  /**
   * Seeds the catalog from the canonical {@link RuntimeEventType} vocabulary.
   */
  private seed;
  /**
   * Registers a domain-specific event type that extends the canonical
   * vocabulary. Domain events keep flowing through the same canonical
   * pipeline while becoming visible to the catalog.
   */
  registerDomainType(type: string, description: string, category?: EventCategory): void;
  /**
   * Returns the catalog entry for a canonical event type, if known.
   */
  entry(type: string): EventCatalogEntry | undefined;
  /**
   * Returns whether the given type is a known canonical event type.
   */
  isCanonical(type: string): boolean;
  /**
   * Returns every catalogued event entry.
   */
  entriesAll(): EventCatalogEntry[];
  /**
   * Returns every event type catalogue known by this catalog.
   */
  types(): string[];
}
/**
 * Injectable wrapper exposing the canonical {@link EventCatalog} through the
 * Nest dependency injection container.
 */
export declare class EventCatalogService {
  private readonly catalog;
  constructor();
  entry(type: string): EventCatalogEntry | undefined;
  isCanonical(type: string): boolean;
  registerDomainType(type: string, description: string, category?: EventCategory): void;
  types(): string[];
  entriesAll(): EventCatalogEntry[];
}
//# sourceMappingURL=event-catalog.d.ts.map
