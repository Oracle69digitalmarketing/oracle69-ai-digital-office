import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import { MissionScheduler } from "../../missions/mission-scheduler.js";

describe("MissionScheduler", () => {
  let scheduler: MissionScheduler;

  beforeEach(() => {
    scheduler = new MissionScheduler();
  });

  it("should schedule mission", () => {
    const logSpy = jest.spyOn(scheduler["logger"], "log").mockImplementation(() => {});
    scheduler.scheduleMission("m1", "* * * * *");
    expect(logSpy).toHaveBeenCalled();
    logSpy.mockRestore();
  });
});
