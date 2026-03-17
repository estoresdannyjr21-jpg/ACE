import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
export declare class NotificationsScheduler {
    private prisma;
    private notifications;
    constructor(prisma: PrismaService, notifications: NotificationsService);
    hourly(): Promise<void>;
    private processPendingAcceptanceReminders;
    private processCallTimeReminders;
}
