import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { GovernanceEngine, PolicyEngine, AuditEngine } from "../../governance/governance-engine.js";

describe("GovernanceEngine", () => {
  let engine: GovernanceEngine;
  let policy: PolicyEngine;
  let audit: AuditEngine;

  beforeEach(() => {
    policy = new PolicyEngine();
    audit = new AuditEngine();
    engine = new GovernanceEngine(policy, audit);
  });

  it("should enforce policy", async () => {
    const spy = jest.spyOn(audit, "record").mockResolvedValue();
    await engine.enforce("p1", {});
    expect(spy).toHaveBeenCalled();
  });
});
