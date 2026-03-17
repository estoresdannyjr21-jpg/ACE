import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/register-device.dto';
export declare class NotificationsController {
    private readonly service;
    constructor(service: NotificationsService);
    list(req: any): Promise<{
        id: string;
        createdAt: Date;
        status: import(".prisma/client").$Enums.NotificationStatus;
        type: import(".prisma/client").$Enums.NotificationType;
        title: string;
        userId: string;
        body: string;
        payloadJson: import("@prisma/client/runtime/library").JsonValue | null;
        readAt: Date | null;
    }[]>;
    markRead(req: any, id: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    registerDevice(req: any, dto: RegisterDeviceDto): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        token: string;
        deviceId: string | null;
    }>;
    unregisterDevice(req: any, dto: UnregisterDeviceDto): Promise<{
        ok: boolean;
    }>;
}
