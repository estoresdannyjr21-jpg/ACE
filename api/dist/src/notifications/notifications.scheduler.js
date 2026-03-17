"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsScheduler = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../common/prisma/prisma.service");
const notifications_service_1 = require("./notifications.service");
const client_1 = require("@prisma/client");
let NotificationsScheduler = class NotificationsScheduler {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async hourly() {
        await this.processPendingAcceptanceReminders();
        await this.processCallTimeReminders();
    }
    async processPendingAcceptanceReminders() {
        const trips = await this.prisma.trip.findMany({
            where: {
                assignmentStatus: client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
                assignedDriverId: { not: null },
                highLevelTripStatus: { notIn: [client_1.HighLevelTripStatus.CANCELLED] },
            },
            select: {
                id: true,
                tenantId: true,
                internalRef: true,
                assignedDriverId: true,
            },
            take: 500,
        });
        for (const trip of trips) {
            const driverUser = await this.prisma.user.findFirst({
                where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
                select: { id: true },
            });
            if (!driverUser)
                continue;
            const payload = { tripId: trip.id };
            const sent = await this.notifications.wasSentInLastHour({
                userId: driverUser.id,
                type: client_1.NotificationType.TRIP_ASSIGNMENT_REMINDER,
                payloadJson: payload,
            });
            if (sent)
                continue;
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: driverUser.id,
                type: client_1.NotificationType.TRIP_ASSIGNMENT_REMINDER,
                title: 'Trip assignment pending acceptance',
                body: `Please accept your assigned trip (${trip.internalRef}).`,
                payloadJson: payload,
            });
        }
    }
    async processCallTimeReminders() {
        const now = new Date();
        const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);
        const trips = await this.prisma.trip.findMany({
            where: {
                assignmentStatus: client_1.AssignmentStatus.ACCEPTED,
                highLevelTripStatus: { notIn: [client_1.HighLevelTripStatus.COMPLETED, client_1.HighLevelTripStatus.CANCELLED] },
                callTime: { lte: now },
            },
            select: {
                id: true,
                tenantId: true,
                internalRef: true,
                assignedDriverId: true,
                callTime: true,
                lastDriverEventAt: true,
            },
            take: 500,
        });
        for (const trip of trips) {
            if (!trip.assignedDriverId)
                continue;
            const reminderWindowStart = new Date(trip.callTime.getTime() - 3 * 60 * 60 * 1000);
            if (now < reminderWindowStart)
                continue;
            const driverUser = await this.prisma.user.findFirst({
                where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
                select: { id: true },
            });
            if (!driverUser)
                continue;
            const noUpdatesSinceWindow = !trip.lastDriverEventAt || trip.lastDriverEventAt < reminderWindowStart;
            if (noUpdatesSinceWindow) {
                const payload = { tripId: trip.id };
                const sent = await this.notifications.wasSentInLastHour({
                    userId: driverUser.id,
                    type: client_1.NotificationType.CALLTIME_REMINDER_DRIVER,
                    payloadJson: payload,
                });
                if (!sent) {
                    await this.notifications.create({
                        tenantId: trip.tenantId,
                        userId: driverUser.id,
                        type: client_1.NotificationType.CALLTIME_REMINDER_DRIVER,
                        title: 'Reminder: trip update needed',
                        body: `Please submit an update for trip (${trip.internalRef}).`,
                        payloadJson: payload,
                    });
                }
            }
            if (now >= trip.callTime && noUpdatesSinceWindow) {
                const coordinators = await this.prisma.user.findMany({
                    where: { tenantId: trip.tenantId, role: client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
                    select: { id: true },
                    take: 50,
                });
                for (const coord of coordinators) {
                    const payload = { tripId: trip.id };
                    const sent = await this.notifications.wasSentInLastHour({
                        userId: coord.id,
                        type: client_1.NotificationType.NO_UPDATE_ALERT_COORDINATOR,
                        payloadJson: payload,
                    });
                    if (sent)
                        continue;
                    await this.notifications.create({
                        tenantId: trip.tenantId,
                        userId: coord.id,
                        type: client_1.NotificationType.NO_UPDATE_ALERT_COORDINATOR,
                        title: 'No driver updates after call time',
                        body: `Trip (${trip.internalRef}) has no updates since reminder window began.`,
                        payloadJson: payload,
                    });
                }
            }
        }
    }
};
exports.NotificationsScheduler = NotificationsScheduler;
__decorate([
    (0, schedule_1.Cron)('0 0 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NotificationsScheduler.prototype, "hourly", null);
exports.NotificationsScheduler = NotificationsScheduler = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], NotificationsScheduler);
//# sourceMappingURL=notifications.scheduler.js.map