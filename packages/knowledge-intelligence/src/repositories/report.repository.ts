import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { KnowledgeReport } from '../types.js';

export const KNOWLEDGE_REPORT_REPOSITORY = 'KNOWLEDGE_REPORT_REPOSITORY';

export interface ReportRepository {
  create(report: Omit<KnowledgeReport, 'id' | 'createdAt'>): Promise<KnowledgeReport>;
  findByOrganization(organizationId: string, limit?: number): Promise<KnowledgeReport[]>;
}

@Injectable()
export class PrismaReportRepository implements ReportRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error('PrismaService is not available');
    }
    return this.prisma;
  }

  async create(report: Omit<KnowledgeReport, 'id' | 'createdAt'>): Promise<KnowledgeReport> {
    const created = await this.db.knowledgeReport.create({
      data: {
        period: report.period,
        knowledgeScore: report.knowledgeScore,
        summary: report.summary as unknown as object,
        organizationId: report.organizationId,
      },
    });
    return this.fromRow(created, report);
  }

  async findByOrganization(organizationId: string, limit = 20): Promise<KnowledgeReport[]> {
    const rows = await this.db.knowledgeReport.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map((row) => this.fromRow(row));
  }

  private fromRow(row: any, source?: Omit<KnowledgeReport, 'id' | 'createdAt'>): KnowledgeReport {
    return {
      id: row.id,
      period: row.period,
      knowledgeScore: row.knowledgeScore,
      summary: source?.summary ?? row.summary,
      organizationId: row.organizationId,
      createdAt: row.createdAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryReportRepository implements ReportRepository {
  private reports: KnowledgeReport[] = [];

  async create(report: Omit<KnowledgeReport, 'id' | 'createdAt'>): Promise<KnowledgeReport> {
    const created: KnowledgeReport = {
      ...report,
      id: `report-${this.reports.length + 1}`,
      createdAt: new Date().toISOString(),
    };
    this.reports.unshift(created);
    return created;
  }

  async findByOrganization(organizationId: string, limit = 20): Promise<KnowledgeReport[]> {
    return this.reports.filter((r) => r.organizationId === organizationId).slice(0, limit);
  }
}
