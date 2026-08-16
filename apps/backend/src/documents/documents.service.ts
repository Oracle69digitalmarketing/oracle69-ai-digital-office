import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId() {
    return this.tenantContext.getTenantId();
  }

  async findAll() {
    return this.prisma.document.findMany({
      where: {
        project: { organizationId: this.organizationId },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async findOne(id: string) {
    const document = await this.prisma.document.findUnique({
      where: { id },
      include: { project: true },
    });

    if (
      !document ||
      (document.project && document.project.organizationId !== this.organizationId)
    ) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async create(data: any) {
    return this.prisma.document.create({
      data: {
        ...data,
      },
    });
  }
}
