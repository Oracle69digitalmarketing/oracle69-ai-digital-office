import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { AuditLogger, MetricsCollector, HealthMonitor } from "../../observability/observability.js";
import { EventBus } from "../../events/event-bus.js";
import { RuntimeEventType } from "../../events/runtime.events.js";

describe("Observability", () => {
  it("AuditLogger should publish audit events through the canonical EventBus", () => {
    const bus = new EventBus();
    const published: string[] = [];
    bus.allEvents().subscribe((event) => published.push(event.type));

    const logger = new AuditLogger(bus);
    logger.logEntry({ action: "test" });

    expect(published).toContain(RuntimeEventType.AUDIT_ENTRY_CREATED);
  });

  it("MetricsCollector should publish metric events through the canonical EventBus", () => {
    const bus = new EventBus();
    const events: { type: string; name?: string; value?: number }[] = [];
    bus.allEvents().subscribe((event) =>
      events.push({
        type: event.type,
        name: (event.payload as { name?: string }).name,
        value: (event.payload as { value?: number }).value,
      }),
    );

    const collector = new MetricsCollector(bus);
    collector.recordMetric("requests", 42);

    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(RuntimeEventType.RUNTIME_METRIC_RECORDED);
    expect(events[0].name).toBe("requests");
    expect(events[0].value).toBe(42);
  });

  it("HealthMonitor should return healthy", () => {
    const monitor = new HealthMonitor();
    expect(monitor.checkStatus()).toBe("healthy");
  });
});
