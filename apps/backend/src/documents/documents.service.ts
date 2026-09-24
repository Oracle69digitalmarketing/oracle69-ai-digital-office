import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service.js";
import { TenantContextService } from "@oracle69/runtime";
import { CreateDocumentDto } from "./dto/documents.dto.js";

@Injectable()
export class DocumentsService {
  private readonly logger = new Logger(DocumentsService.name);

  constructor(
    private prisma: PrismaService,
    private tenantContext: TenantContextService,
  ) {}

  private get organizationId(): string {
    return this.tenantContext.resolveTenantId();
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

    // Fail closed: a document without a resolvable project is treated as
    // inaccessible rather than inventing ownership for it.
    if (!document || !document.project || document.project.organizationId !== this.organizationId) {
      throw new NotFoundException(`Document with ID ${id} not found`);
    }

    return document;
  }

  async create(data: CreateDocumentDto, userId: string) {
    const orgId = this.organizationId;

    if (!userId || userId.length === 0) {
      throw new NotFoundException("Authenticated user not resolved");
    }

    // Documents must be bound to a project that belongs to the authenticated
    // tenant. A projectless document cannot be attributed and is rejected.
    const project = await this.prisma.project.findUnique({
      where: { id: data.projectId },
    });

    if (!project || project.organizationId !== orgId) {
      throw new NotFoundException("Project not found");
    }

    return this.prisma.document.create({
      data: {
        title: data.title,
        category: data.category,
        storageUrl: data.storageUrl,
        version: data.version ?? "1.0.0",
        status: data.status ?? "active",
        ownerId: userId,
        project: { connect: { id: data.projectId } },
      },
    });
  }
}
