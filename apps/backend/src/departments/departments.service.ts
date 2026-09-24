import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { CreateDepartmentDto } from "./dto/departments.dto.js";

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
  }

  async findAll() {
    return this.prisma.department.findMany({
      where: { organizationId: this.organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const department = await this.prisma.department.findUnique({
      where: { id },
    });

    if (!department || department.organizationId !== this.organizationId) {
      throw new NotFoundException(`Department with ID ${id} not found`);
    }

    return department;
  }

  async create(data: CreateDepartmentDto) {
    return this.prisma.department.create({
      data: {
        name: data.name,
        description: data.description ?? undefined,
        status: data.status ?? "active",
        organizationId: this.organizationId,
      },
    });
  }
}
