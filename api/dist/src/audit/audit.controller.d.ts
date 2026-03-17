import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from './dto';
export declare class AuditController {
    private readonly service;
    constructor(service: AuditService);
    findMany(req: any, query: GetAuditLogsQueryDto): Promise<({
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
        changesJson: import("@prisma/client/runtime/library").JsonValue | null;
        ipAddress: string | null;
        userAgent: string | null;
        userId: string;
    })[]>;
}
