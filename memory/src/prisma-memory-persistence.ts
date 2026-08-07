import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { MemoryRecord } from '@oracle69/shared';
import { IMemoryPersistence } from './memory-manager.js';

@Injectable()
export class PrismaMemoryPersistence implements IMemoryPersistence {
  constructor(private readonly prisma: PrismaClient) {}

  async save(record: MemoryRecord): Promise<void> {
    await this.prisma.longTermMemoryRecord.create({
      data: {
        type: record.type,
        sessionId: record.sessionId,
        content: typeof record.content === 'string' ? record.content : JSON.stringify(record.content),
        metadata: record.metadata,
        timestamp: record.timestamp,
        organizationId: (record.metadata?.organizationId as string) || 'system',
      },
    });
  }

  async search(query: string, limit: number): Promise<MemoryRecord[]> {
    const results = await this.prisma.longTermMemoryRecord.findMany({
      where: {
        content: {
          contains: query,
        },
      },
      take: limit,
      orderBy: {
        timestamp: 'desc',
      },
    });

    return results.map((r: any) => ({
      id: r.id,
      type: r.type as any,
      sessionId: r.sessionId,
      content: r.content,
      metadata: (r.metadata as any) || {},
      timestamp: r.timestamp,
    }));
  }
}
