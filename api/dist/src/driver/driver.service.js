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
exports.DriverService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const notifications_service_1 = require("../notifications/notifications.service");
let DriverService = class DriverService {
    constructor(prisma, notifications) {
        this.prisma = prisma;
        this.notifications = notifications;
    }
    async listMyAvailability(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const where = {
            tenantId: params.tenantId,
            driverId: params.driverId,
            ...(params.from && params.to
                ? { date: { gte: this.toDayStart(params.from), lte: this.toDayStart(params.to) } }
                : {}),
        };
        return this.prisma.driverAvailability.findMany({
            where,
            orderBy: { date: 'asc' },
            take: 120,
        });
    }
    async setMyAvailability(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        if (!params.items.length) {
            throw new common_1.BadRequestException('No items provided');
        }
        const ops = params.items.map((i) => this.prisma.driverAvailability.upsert({
            where: {
                tenantId_driverId_date: {
                    tenantId: params.tenantId,
                    driverId: params.driverId,
                    date: this.toDayStart(i.date),
                },
            },
            update: { status: i.status, codingDay: i.codingDay ?? false, note: i.note ?? null },
            create: {
                tenantId: params.tenantId,
                driverId: params.driverId,
                date: this.toDayStart(i.date),
                status: i.status,
                codingDay: i.codingDay ?? false,
                note: i.note ?? null,
            },
        }));
        return this.prisma.$transaction(ops);
    }
    async getMyTrips(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        return this.prisma.trip.findMany({
            where: {
                tenantId: params.tenantId,
                assignedDriverId: params.driverId,
                ...(params.assignmentStatus ? { assignmentStatus: params.assignmentStatus } : {}),
                ...(params.highLevelTripStatus ? { highLevelTripStatus: params.highLevelTripStatus } : {}),
            },
            include: {
                serviceCategory: true,
                clientAccount: true,
                assignedVehicle: true,
                stops: { orderBy: { stopSequence: 'asc' } },
            },
            orderBy: { callTime: 'asc' },
            take: 200,
        });
    }
    async getMyTrip(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
            include: {
                serviceCategory: true,
                clientAccount: true,
                assignedVehicle: true,
                stops: { orderBy: { stopSequence: 'asc' } },
                events: { orderBy: { eventTime: 'asc' }, include: { media: true } },
                documents: { orderBy: { uploadedAt: 'desc' } },
            },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        return trip;
    }
    async acceptTrip(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
            select: { id: true, assignmentStatus: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE) {
            throw new common_1.BadRequestException('Trip is not pending acceptance');
        }
        return this.prisma.trip.update({
            where: { id: params.tripId },
            data: {
                assignmentStatus: client_1.AssignmentStatus.ACCEPTED,
                acceptedAt: new Date(),
                declinedAt: null,
                declineReason: null,
            },
        });
    }
    async declineTrip(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
            select: { id: true, internalRef: true, assignmentStatus: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE) {
            throw new common_1.BadRequestException('Trip is not pending acceptance');
        }
        const updated = await this.prisma.trip.update({
            where: { id: params.tripId },
            data: {
                assignmentStatus: client_1.AssignmentStatus.DECLINED,
                declinedAt: new Date(),
                declineReason: params.reason ?? 'Declined by driver',
                acceptedAt: null,
            },
        });
        const coordinators = await this.prisma.user.findMany({
            where: { tenantId: trip.tenantId, role: client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
            select: { id: true },
            take: 50,
        });
        for (const u of coordinators) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: u.id,
                type: client_1.NotificationType.TRIP_DECLINED_ALERT,
                title: 'Trip declined by driver',
                body: `Trip ${trip.internalRef} was declined. Reason: ${params.reason ?? 'N/A'}`,
                payloadJson: { tripId: trip.id },
            });
        }
        return updated;
    }
    async createTripEvent(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: params.tripId,
                tenantId: params.tenantId,
                assignedDriverId: params.driverId,
            },
            select: { id: true, assignmentStatus: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before submitting events');
        }
        if (!params.dto.mediaFileKeys?.length) {
            throw new common_1.BadRequestException('At least one media file key is required');
        }
        if (params.dto.stopId) {
            const stop = await this.prisma.tripStop.findFirst({
                where: { id: params.dto.stopId, tripId: params.tripId },
                select: { id: true },
            });
            if (!stop)
                throw new common_1.BadRequestException('Stop not found for this trip');
        }
        const event = await this.prisma.tripEvent.create({
            data: {
                tripId: params.tripId,
                stopId: params.dto.stopId ?? null,
                eventType: params.dto.eventType,
                eventTime: new Date(params.dto.eventTime),
                gpsLat: params.dto.gpsLat ?? null,
                gpsLng: params.dto.gpsLng ?? null,
                gpsAccuracy: params.dto.gpsAccuracy ?? null,
                capturedOffline: params.dto.capturedOffline ?? false,
                createdByUserId: params.userId,
            },
        });
        await this.prisma.tripEventMedia.createMany({
            data: params.dto.mediaFileKeys.map((fileKey) => ({
                tripEventId: event.id,
                fileKey,
            })),
        });
        await this.prisma.trip.update({
            where: { id: params.tripId },
            data: { lastDriverEventAt: new Date() },
        });
        return this.prisma.tripEvent.findFirst({
            where: { id: event.id },
            include: { media: true },
        });
    }
    async uploadPod(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
            select: { id: true, assignmentStatus: true, podStatus: true, internalRef: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before uploading POD');
        }
        await this.prisma.tripDocument.create({
            data: {
                tripId: params.tripId,
                docType: client_1.DocumentType.POD_RUNSHEET,
                fileKey: params.fileKey,
                uploadedByUserId: params.userId,
            },
        });
        const updated = await this.prisma.trip.update({
            where: { id: params.tripId },
            data: {
                podStatus: client_1.PODStatus.POD_UPLOADED_PENDING_REVIEW,
            },
        });
        const coordinators = await this.prisma.user.findMany({
            where: { tenantId: trip.tenantId, role: client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
            select: { id: true },
            take: 50,
        });
        for (const u of coordinators) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: u.id,
                type: client_1.NotificationType.POD_UPLOADED_PENDING_REVIEW,
                title: 'POD uploaded, pending review',
                body: `Trip ${trip.internalRef} has a POD/Runsheet uploaded and needs verification.`,
                payloadJson: { tripId: trip.id },
            });
        }
        return updated;
    }
    async uploadReimbursableDoc(params) {
        if (!params.driverId) {
            throw new common_1.ForbiddenException('Driver user is not linked to a driver');
        }
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
            select: { id: true, assignmentStatus: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before uploading reimbursable docs');
        }
        const docTypeMap = { TOLL: client_1.DocumentType.TOLL, GAS: client_1.DocumentType.GAS, PARKING: client_1.DocumentType.PARKING };
        const docType = docTypeMap[params.docType];
        return this.prisma.tripDocument.create({
            data: {
                tripId: params.tripId,
                docType,
                fileKey: params.fileKey,
                uploadedByUserId: params.userId,
            },
        });
    }
    toDayStart(dateIso) {
        const d = new Date(dateIso);
        return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
};
exports.DriverService = DriverService;
exports.DriverService = DriverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notifications_service_1.NotificationsService])
], DriverService);
//# sourceMappingURL=driver.service.js.map