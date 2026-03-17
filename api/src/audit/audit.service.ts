import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    userId: string;
    action: string;
    entityType: string;
    entityId?: string;
    changesJson?: Prisma.InputJsonValue;
    ipAddress?: string;
    userAgent?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenantId: params.tenantId,
        userId: params.userId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        changesJson: params.changesJson,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      },
    });
  }

  async findMany(
    tenantId: string,
    query: {
      entityType?: string;
      entityId?: string;
      userId?: string;
      action?: string;
      from?: string;
      to?: string;
    },
  ) {
    const dateFilter: Prisma.DateTimeFilter = {};
    if (query.from) dateFilter.gte = new Date(query.from);
    if (query.to) dateFilter.lte = new Date(query.to);

    const where: Prisma.AuditLogWhereInput = {
      tenantId,
      ...(query.entityType && { entityType: query.entityType }),
      ...(query.entityId && { entityId: query.entityId }),
      ...(query.userId && { userId: query.userId }),
      ...(query.action && { action: query.action }),
      ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter }),
    };

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 500,
    });
  }
}
