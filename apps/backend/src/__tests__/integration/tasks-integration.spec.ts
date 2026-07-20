import { Test, TestingModule } from "@nestjs/testing";
import { TasksService } from "../../tasks/tasks.service.js";
import { PrismaModule } from "../../prisma/prisma.module.js";
import { SharedModule } from "@oracle69/shared";

describe("TasksService Integration", () => {
  let service: TasksService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [PrismaModule, SharedModule],
      providers: [TasksService],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
