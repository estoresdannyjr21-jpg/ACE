import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationType, Prisma } from '@prisma/client';
import { FcmService } from './fcm.service';
export declare class NotificationsService {
    private prisma;
    private fcm;
    constructor(prisma: PrismaService, fcm: FcmService);
    create(params: {
        tenantId: string;
        userId: string;
        type: NotificationType;
        title: string;
        body: string;
        payloadJson?: Prisma.InputJsonValue;
    }): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        payloadJson: Prisma.JsonValue | null;
        readAt: Date | null;
    }>;
    private sendFcmPush;
    registerDevice(userId: string, token: string, deviceId?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        token: string;
        deviceId: string | null;
    }>;
    unregisterDevice(userId: string, token: string): Promise<{
        ok: boolean;
    }>;
    list(userId: string): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        payloadJson: Prisma.JsonValue | null;
        readAt: Date | null;
    }[]>;
    markRead(userId: string, id: string): Promise<Prisma.BatchPayload>;
    wasSentInLastHour(params: {
        userId: string;
        type: NotificationType;
        payloadJson?: Prisma.InputJsonValue;
    }): Promise<boolean>;
}
