import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class AuditService {
    private prisma;
    constructor(prisma: PrismaService);
    log(params: {
        tenantId: string;
        userId: string;
        action: string;
        entityType: string;
        entityId?: string;
        changesJson?: Prisma.InputJsonValue;
        ipAddress?: string;
        userAgent?: string;
    }): Promise<{
        id: string;
        createdAt: Date;
        tenantId: string;
        action: string;
        entityType: string;
        entityId: string | null;
        changesJson: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    }>;
    findMany(tenantId: string, query: {
        entityType?: string;
        entityId?: string;
        userId?: string;
        action?: string;
        from?: string;
        to?: string;
    }): Promise<({
        user: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        tenantId: string;
        action: string;
        entityType: string;
        entityId: string | null;
        changesJson: Prisma.JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    })[]>;
}
