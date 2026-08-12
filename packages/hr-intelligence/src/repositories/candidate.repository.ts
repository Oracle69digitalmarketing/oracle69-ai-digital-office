import { Inject, Injectable, Optional } from '@nestjs/common';
import type { PrismaClient } from '@prisma/client';
import { CandidateStage, HrCandidate } from '../types.js';

export const HR_CANDIDATE_REPOSITORY = 'HR_CANDIDATE_REPOSITORY';

export interface CandidateRepository {
  create(candidate: Omit<HrCandidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<HrCandidate>;
  update(id: string, data: Partial<HrCandidate>): Promise<HrCandidate>;
  findById(id: string, organizationId?: string): Promise<HrCandidate | null>;
  findByOrganization(organizationId: string, stage?: CandidateStage): Promise<HrCandidate[]>;
  findByPosition(positionId: string, organizationId: string): Promise<HrCandidate[]>;
}

@Injectable()
export class PrismaCandidateRepository implements CandidateRepository {
  constructor(@Optional() @Inject('PrismaService') private readonly prisma?: PrismaClient) {}

  private get db(): PrismaClient {
    if (!this.prisma) {
      throw new Error('PrismaService is not available');
    }
    return this.prisma;
  }

  async create(candidate: Omit<HrCandidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<HrCandidate> {
    const data = {
      ...candidate,
      appliedAt: new Date(candidate.appliedAt),
      ...(candidate.offeredAt ? { offeredAt: new Date(candidate.offeredAt) } : {}),
      ...(candidate.hiredAt ? { hiredAt: new Date(candidate.hiredAt) } : {}),
    };
    const created = await this.db.hrCandidate.create({ data });
    return this.fromRow({ ...data, ...created });
  }

  async update(id: string, data: Partial<HrCandidate>): Promise<HrCandidate> {
    const updated = await this.db.hrCandidate.update({
      where: { id },
      data: {
        ...data as any,
        ...(data.appliedAt ? { appliedAt: new Date(data.appliedAt) } : {}),
        ...(data.offeredAt ? { offeredAt: new Date(data.offeredAt) } : {}),
        ...(data.hiredAt ? { hiredAt: new Date(data.hiredAt) } : {}),
      },
    });
    return this.fromRow({ ...data as any, ...updated });
  }

  async findById(id: string, organizationId?: string): Promise<HrCandidate | null> {
    const row = await this.db.hrCandidate.findUnique({ where: { id } });
    if (!row) return null;
    if (organizationId && row.organizationId !== organizationId) return null;
    return this.fromRow(row);
  }

  async findByOrganization(organizationId: string, stage?: CandidateStage): Promise<HrCandidate[]> {
    const rows = await this.db.hrCandidate.findMany({
      where: {
        organizationId,
        ...(stage ? { stage } : {}),
      },
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map(row => this.fromRow(row));
  }

  async findByPosition(positionId: string, organizationId: string): Promise<HrCandidate[]> {
    const rows = await this.db.hrCandidate.findMany({
      where: { positionId, organizationId },
      orderBy: { appliedAt: 'desc' },
    });
    return rows.map(row => this.fromRow(row));
  }

  private fromRow(row: any): HrCandidate {
    return {
      ...row,
      appliedAt: row.appliedAt.toISOString(),
      ...(row.offeredAt ? { offeredAt: row.offeredAt.toISOString() } : {}),
      ...(row.hiredAt ? { hiredAt: row.hiredAt.toISOString() } : {}),
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}

@Injectable()
export class InMemoryCandidateRepository implements CandidateRepository {
  private candidates = new Map<string, HrCandidate>();

  async create(candidate: Omit<HrCandidate, 'id' | 'createdAt' | 'updatedAt'>): Promise<HrCandidate> {
    const id = Math.random().toString(36).substring(7);
    const now = new Date().toISOString();
    const created: HrCandidate = {
      ...candidate,
      id,
      createdAt: now,
      updatedAt: now,
    };
    this.candidates.set(id, created);
    return created;
  }

  async update(id: string, data: Partial<HrCandidate>): Promise<HrCandidate> {
    const existing = this.candidates.get(id);
    if (!existing) throw new Error('Candidate not found');
    const updated = { ...existing, ...data, updatedAt: new Date().toISOString() };
    this.candidates.set(id, updated);
    return updated;
  }

  async findById(id: string, organizationId?: string): Promise<HrCandidate | null> {
    const c = this.candidates.get(id);
    if (!c) return null;
    if (organizationId && c.organizationId !== organizationId) return null;
    return c;
  }

  async findByOrganization(organizationId: string, stage?: CandidateStage): Promise<HrCandidate[]> {
    return Array.from(this.candidates.values())
      .filter(c => c.organizationId === organizationId && (!stage || c.stage === stage))
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }

  async findByPosition(positionId: string, organizationId: string): Promise<HrCandidate[]> {
    return Array.from(this.candidates.values())
      .filter(c => c.positionId === positionId && c.organizationId === organizationId)
      .sort((a, b) => b.appliedAt.localeCompare(a.appliedAt));
  }
}
