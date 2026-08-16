import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { PrismaEmployeeRepository } from "../repositories/employee.repository.js";
import { PrismaPositionRepository } from "../repositories/position.repository.js";
import { PrismaCandidateRepository } from "../repositories/candidate.repository.js";
import { CandidateStage, EmployeeStatus, PositionStatus } from "../types.js";

function mockPrisma() {
  return {
    hrEmployee: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    hrPosition: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    hrCandidate: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  } as any;
}

describe("Prisma HR repositories", () => {
  let prisma: any;

  beforeEach(() => {
    prisma = mockPrisma();
  });

  it("should scope employee reads by organization and status", async () => {
    prisma.hrEmployee.findMany.mockResolvedValue([]);
    const repo = new PrismaEmployeeRepository(prisma);

    await repo.findByOrganization("org-1", EmployeeStatus.ACTIVE);

    expect(prisma.hrEmployee.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", status: EmployeeStatus.ACTIVE }),
      }),
    );
  });

  it("should reject cross-tenant employee reads by id", async () => {
    prisma.hrEmployee.findUnique.mockResolvedValue({
      id: "emp-1",
      organizationId: "org-a",
      hireDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaEmployeeRepository(prisma);

    expect(await repo.findById("emp-1", "org-b")).toBeNull();
    expect(await repo.findById("emp-1", "org-a")).not.toBeNull();
  });

  it("should scope position reads by organization and status", async () => {
    prisma.hrPosition.findMany.mockResolvedValue([]);
    const repo = new PrismaPositionRepository(prisma);

    await repo.findByOrganization("org-1", PositionStatus.OPEN);

    expect(prisma.hrPosition.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ organizationId: "org-1", status: PositionStatus.OPEN }),
      }),
    );
  });

  it("should reject cross-tenant position reads by id", async () => {
    prisma.hrPosition.findUnique.mockResolvedValue({
      id: "pos-1",
      organizationId: "org-a",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaPositionRepository(prisma);

    expect(await repo.findById("pos-1", "org-b")).toBeNull();
  });

  it("should scope candidate reads by organization and stage", async () => {
    prisma.hrCandidate.findMany.mockResolvedValue([]);
    const repo = new PrismaCandidateRepository(prisma);

    await repo.findByOrganization("org-1", CandidateStage.INTERVIEWING);

    expect(prisma.hrCandidate.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          organizationId: "org-1",
          stage: CandidateStage.INTERVIEWING,
        }),
      }),
    );
  });

  it("should reject cross-tenant candidate reads by id", async () => {
    prisma.hrCandidate.findUnique.mockResolvedValue({
      id: "cand-1",
      organizationId: "org-a",
      appliedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaCandidateRepository(prisma);

    expect(await repo.findById("cand-1", "org-b")).toBeNull();
  });

  it("should persist an employee with parsed dates", async () => {
    prisma.hrEmployee.create.mockResolvedValue({
      id: "emp-new",
      organizationId: "org-1",
      hireDate: new Date("2026-08-01T00:00:00.000Z"),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    const repo = new PrismaEmployeeRepository(prisma);

    const created = await repo.create({
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      department: "Engineering",
      title: "Engineer",
      status: EmployeeStatus.ACTIVE,
      hireDate: "2026-08-01T00:00:00.000Z",
      organizationId: "org-1",
    });

    expect(created.fullName).toBe("Ada Lovelace");
    expect(prisma.hrEmployee.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ hireDate: new Date("2026-08-01T00:00:00.000Z") }),
    });
  });

  it("should fail fast without PrismaService", async () => {
    const repo = new PrismaEmployeeRepository(undefined as never);
    await expect(
      repo.create({
        fullName: "No DB",
        email: "no@example.com",
        department: "Eng",
        title: "E",
        status: EmployeeStatus.ACTIVE,
        hireDate: "2026-08-01T00:00:00.000Z",
        organizationId: "org-1",
      }),
    ).rejects.toThrow("PrismaService is not available");
  });
});
