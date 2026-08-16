import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class DepartmentsService {
  private readonly logger = new Logger(DepartmentsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
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

  async create(data: any) {
    return this.prisma.department.create({
      data: {
        ...data,
        organizationId: this.organizationId,
      },
    });
  }
}
