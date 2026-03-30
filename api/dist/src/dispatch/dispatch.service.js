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
exports.DispatchService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
const uuid_1 = require("uuid");
const notifications_service_1 = require("../notifications/notifications.service");
const incidents_service_1 = require("../incidents/incidents.service");
const barcode_cover_service_1 = require("../barcode-cover/barcode-cover.service");
const rates_service_1 = require("../rates/rates.service");
const RATE_EXPIRY_WARNING_DAYS = 7;
const SEARCH_LIMIT = 10;
let DispatchService = class DispatchService {
    constructor(prisma, audit, notifications, incidents, barcodeCover, ratesService) {
        this.prisma = prisma;
        this.audit = audit;
        this.notifications = notifications;
        this.incidents = incidents;
        this.barcodeCover = barcodeCover;
        this.ratesService = ratesService;
    }
    async getLookups(tenantId) {
        const clients = await this.prisma.clientAccount.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                code: true,
                serviceCategories: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, code: true },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        const drivers = await this.prisma.driver.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                firstName: true,
                lastName: true,
                assignments: {
                    where: { endDate: null },
                    take: 1,
                    select: {
                        operatorId: true,
                        operator: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        });
        const vehicles = await this.prisma.vehicle.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                plateNumber: true,
                vehicleType: true,
                bodyType: true,
                assignments: {
                    where: { endDate: null },
                    take: 1,
                    select: {
                        operatorId: true,
                        operator: { select: { id: true, name: true } },
                    },
                },
            },
            orderBy: [{ plateNumber: 'asc' }],
        });
        const operators = await this.prisma.operator.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: { id: true, name: true },
            orderBy: { name: 'asc' },
        });
        const [originRows, destRows, tripVtRows, vehVtRows] = await Promise.all([
            this.prisma.trip.groupBy({
                by: ['originArea'],
                where: { tenantId },
            }),
            this.prisma.trip.groupBy({
                by: ['destinationArea'],
                where: { tenantId },
            }),
            this.prisma.trip.groupBy({
                by: ['vehicleType'],
                where: { tenantId },
            }),
            this.prisma.vehicle.groupBy({
                by: ['vehicleType'],
                where: { tenantId, status: 'ACTIVE' },
            }),
        ]);
        const uniqSorted = (values) => [...new Set(values.map((s) => String(s).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        const tripFieldOptions = {
            originAreas: uniqSorted(originRows.map((r) => r.originArea)),
            destinationAreas: uniqSorted(destRows.map((r) => r.destinationArea)),
            vehicleTypes: uniqSorted([
                ...tripVtRows.map((r) => r.vehicleType),
                ...vehVtRows.map((r) => r.vehicleType),
            ]),
        };
        return { clients, drivers, vehicles, operators, tripFieldOptions };
    }
    async createTrip(userId, tenantId, dto) {
        const driver = await this.prisma.driver.findUnique({
            where: { id: dto.assignedDriverId },
            include: {
                assignments: {
                    where: { endDate: null },
                    take: 1,
                },
            },
        });
        if (!driver) {
            throw new common_1.NotFoundException('Driver not found');
        }
        if (!driver.assignments.length) {
            throw new common_1.BadRequestException('Driver has no active operator assignment');
        }
        const operatorId = driver.assignments[0].operatorId;
        const vehicle = await this.prisma.vehicle.findUnique({
            where: { id: dto.assignedVehicleId },
            include: {
                assignments: {
                    where: { endDate: null },
                    take: 1,
                },
            },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        if (!vehicle.assignments.length || vehicle.assignments[0].operatorId !== operatorId) {
            throw new common_1.BadRequestException('Vehicle must be assigned to the same operator as the driver');
        }
        const internalRef = `TR-${Date.now()}-${(0, uuid_1.v4)().substring(0, 8).toUpperCase()}`;
        const serviceCategory = await this.prisma.serviceCategory.findUnique({
            where: { id: dto.serviceCategoryId },
        });
        if (!serviceCategory) {
            throw new common_1.NotFoundException('Service category not found');
        }
        const runsheetDate = new Date(dto.runsheetDate);
        const activeRate = await this.ratesService.getActiveRateForTrip(tenantId, dto.clientAccountId, dto.serviceCategoryId, dto.originArea, dto.destinationArea, runsheetDate);
        if (!activeRate) {
            throw new common_1.BadRequestException('No active route rate for this trip date and route. Add a rate or extend the effective period before creating the trip.');
        }
        const trip = await this.prisma.trip.create({
            data: {
                tenantId,
                clientAccountId: dto.clientAccountId,
                serviceCategoryId: dto.serviceCategoryId,
                segmentType: serviceCategory.segmentType,
                internalRef,
                externalRef: dto.externalRef,
                requestDeliveryDate: dto.requestDeliveryDate ? new Date(dto.requestDeliveryDate) : null,
                runsheetDate: new Date(dto.runsheetDate),
                abStatus: dto.abStatus,
                originArea: dto.originArea,
                destinationArea: dto.destinationArea,
                routeCode: dto.routeCode,
                tripOrder: dto.tripOrder,
                callTime: new Date(dto.callTime),
                vehicleType: dto.vehicleType,
                assignedDriverId: dto.assignedDriverId,
                assignedVehicleId: dto.assignedVehicleId,
                operatorIdAtAssignment: operatorId,
                assignmentStatus: client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
                assignedAt: new Date(),
                createdByUserId: userId,
            },
            include: {
                assignedDriver: true,
                assignedVehicle: true,
                serviceCategory: true,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'CREATE',
            entityType: 'TRIP_CREATE',
            entityId: trip.id,
            changesJson: {
                internalRef: trip.internalRef,
                assignedDriverId: trip.assignedDriverId,
                assignedVehicleId: trip.assignedVehicleId,
                operatorIdAtAssignment: operatorId,
                runsheetDate: trip.runsheetDate.toISOString(),
            },
        });
        const rateExpiryWarning = activeRate.effectiveEnd &&
            new Date(activeRate.effectiveEnd).getTime() - runsheetDate.getTime() <=
                RATE_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
        return { trip, rateExpiryWarning: !!rateExpiryWarning };
    }
    async getTrips(tenantId, query) {
        const where = { tenantId };
        if (query?.dateFrom || query?.dateTo) {
            where.runsheetDate = {};
            if (query.dateFrom)
                where.runsheetDate.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.runsheetDate.lte = new Date(query.dateTo);
        }
        if (query?.assignmentStatus)
            where.assignmentStatus = query.assignmentStatus;
        if (query?.highLevelTripStatus)
            where.highLevelTripStatus = query.highLevelTripStatus;
        if (query?.podStatus)
            where.podStatus = query.podStatus;
        if (query?.clientAccountId)
            where.clientAccountId = query.clientAccountId;
        if (query?.internalRef)
            where.internalRef = { contains: query.internalRef, mode: 'insensitive' };
        const totalCount = await this.prisma.trip.count({ where });
        const items = await this.prisma.trip.findMany({
            where,
            include: {
                assignedDriver: true,
                assignedVehicle: true,
                serviceCategory: true,
                clientAccount: true,
            },
            orderBy: { createdAt: 'desc' },
            ...(query?.limit != null
                ? { take: query.limit, skip: query.offset ?? 0 }
                : {}),
        });
        return { items, totalCount };
    }
    async getTripById(tenantId, tripId) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                tenantId,
            },
            include: {
                assignedDriver: true,
                assignedVehicle: true,
                serviceCategory: true,
                clientAccount: true,
                stops: {
                    orderBy: { stopSequence: 'asc' },
                    include: {
                        events: {
                            orderBy: { eventTime: 'asc' },
                            include: { media: true },
                        },
                    },
                },
                documents: true,
                incidents: true,
                finance: true,
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        return trip;
    }
    async verifyPOD(userId, tenantId, tripId, dto) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_UPLOADED_PENDING_REVIEW) {
            throw new common_1.BadRequestException('POD is not in pending review status');
        }
        const updated = await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                podStatus: client_1.PODStatus.POD_VERIFIED,
                podLastReviewedByUserId: userId,
                podLastReviewedAt: new Date(),
                podRejectionComment: null,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'POD_VERIFY',
            entityId: tripId,
            changesJson: { podStatus: 'POD_VERIFIED' },
        });
        const tripForBarcode = await this.prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                clientAccount: { select: { name: true, code: true } },
                serviceCategory: { select: { name: true, code: true } },
                assignedDriver: { select: { firstName: true, lastName: true } },
                assignedVehicle: { select: { plateNumber: true } },
            },
        });
        let fileKey;
        if (tripForBarcode) {
            const result = await this.barcodeCover.generateAndSave(tripForBarcode);
            fileKey = result.fileKey;
        }
        else {
            fileKey = `barcode-cover/${tripId}/${updated.internalRef}-${Date.now()}.pdf`;
        }
        await this.prisma.tripDocument.create({
            data: {
                tripId,
                docType: client_1.DocumentType.BARCODE_COVER_SHEET,
                fileKey,
                uploadedByUserId: userId,
            },
        });
        return updated;
    }
    async rejectPOD(userId, tenantId, tripId, dto) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_UPLOADED_PENDING_REVIEW) {
            throw new common_1.BadRequestException('POD is not in pending review status');
        }
        const updated = await this.prisma.trip.update({
            where: { id: tripId },
            data: {
                podStatus: client_1.PODStatus.POD_REJECTED_NEEDS_REUPLOAD,
                podLastReviewedByUserId: userId,
                podLastReviewedAt: new Date(),
                podRejectionComment: dto.comment,
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'POD_REJECT',
            entityId: tripId,
            changesJson: { podStatus: 'POD_REJECTED_NEEDS_REUPLOAD', comment: dto.comment },
        });
        return updated;
    }
    async proxyCreateTripEvent(params) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId },
            select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.assignedDriverId)
            throw new common_1.BadRequestException('Trip has no assigned driver');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before encoding events on behalf of driver');
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
            data: params.dto.mediaFileKeys.map((fileKey) => ({ tripEventId: event.id, fileKey })),
        });
        await this.prisma.trip.update({
            where: { id: params.tripId },
            data: { lastDriverEventAt: new Date() },
        });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'CREATE',
            entityType: 'TRIP_EVENT_PROXY',
            entityId: params.tripId,
            changesJson: {
                reason: params.dto.reason,
                onBehalfOfDriverId: trip.assignedDriverId,
                event: {
                    id: event.id,
                    eventType: params.dto.eventType,
                    eventTime: params.dto.eventTime,
                    stopId: params.dto.stopId ?? null,
                    gpsLat: params.dto.gpsLat ?? null,
                    gpsLng: params.dto.gpsLng ?? null,
                    gpsAccuracy: params.dto.gpsAccuracy ?? null,
                    capturedOffline: params.dto.capturedOffline ?? false,
                    mediaFileKeys: params.dto.mediaFileKeys,
                },
            },
        });
        const driverUser = await this.prisma.user.findFirst({
            where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
            select: { id: true },
        });
        if (driverUser) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: driverUser.id,
                type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                title: 'Manual update recorded',
                body: `A coordinator encoded an update for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
                payloadJson: { tripId: trip.id },
            });
        }
        return this.prisma.tripEvent.findFirst({ where: { id: event.id }, include: { media: true } });
    }
    async proxyUploadPod(params) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId },
            select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.assignedDriverId)
            throw new common_1.BadRequestException('Trip has no assigned driver');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before uploading POD on behalf of driver');
        }
        await this.prisma.tripDocument.create({
            data: {
                tripId: params.tripId,
                docType: client_1.DocumentType.POD_RUNSHEET,
                fileKey: params.dto.fileKey,
                uploadedByUserId: params.userId,
            },
        });
        const updated = await this.prisma.trip.update({
            where: { id: params.tripId },
            data: { podStatus: client_1.PODStatus.POD_UPLOADED_PENDING_REVIEW },
        });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'UPDATE',
            entityType: 'POD_UPLOAD_PROXY',
            entityId: params.tripId,
            changesJson: {
                reason: params.dto.reason,
                onBehalfOfDriverId: trip.assignedDriverId,
                podStatus: 'POD_UPLOADED_PENDING_REVIEW',
                fileKey: params.dto.fileKey,
            },
        });
        const driverUser = await this.prisma.user.findFirst({
            where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
            select: { id: true },
        });
        if (driverUser) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: driverUser.id,
                type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                title: 'Manual POD upload recorded',
                body: `A coordinator uploaded the POD/Runsheet for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
                payloadJson: { tripId: trip.id },
            });
        }
        return updated;
    }
    async proxyUploadReimbursableDoc(params) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId },
            select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.assignedDriverId)
            throw new common_1.BadRequestException('Trip has no assigned driver');
        if (trip.assignmentStatus !== client_1.AssignmentStatus.ACCEPTED) {
            throw new common_1.BadRequestException('Trip must be accepted before uploading reimbursable doc on behalf of driver');
        }
        const docTypeMap = { TOLL: client_1.DocumentType.TOLL, GAS: client_1.DocumentType.GAS, PARKING: client_1.DocumentType.PARKING };
        const doc = await this.prisma.tripDocument.create({
            data: {
                tripId: params.tripId,
                docType: docTypeMap[params.dto.docType],
                fileKey: params.dto.fileKey,
                uploadedByUserId: params.userId,
            },
        });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'CREATE',
            entityType: 'REIMBURSABLE_DOC_PROXY',
            entityId: params.tripId,
            changesJson: {
                reason: params.dto.reason,
                onBehalfOfDriverId: trip.assignedDriverId,
                docType: params.dto.docType,
                fileKey: params.dto.fileKey,
            },
        });
        const driverUser = await this.prisma.user.findFirst({
            where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
            select: { id: true },
        });
        if (driverUser) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: driverUser.id,
                type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                title: 'Manual reimbursable doc upload',
                body: `A coordinator uploaded a ${params.dto.docType} doc for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
                payloadJson: { tripId: trip.id },
            });
        }
        return doc;
    }
    async proxyCreateIncident(params) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: params.tripId, tenantId: params.tenantId },
            select: { id: true, internalRef: true, assignedDriverId: true, tenantId: true },
        });
        if (!trip)
            throw new common_1.NotFoundException('Trip not found');
        if (!trip.assignedDriverId)
            throw new common_1.BadRequestException('Trip has no assigned driver');
        const incident = await this.incidents.create(params.userId, params.tenantId, {
            tripId: params.tripId,
            incidentType: params.dto.incidentType,
            severity: params.dto.severity,
            description: params.dto.description,
            gpsLat: params.dto.gpsLat,
            gpsLng: params.dto.gpsLng,
            gpsAccuracy: params.dto.gpsAccuracy,
        });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'CREATE',
            entityType: 'INCIDENT_PROXY',
            entityId: incident.id,
            changesJson: {
                reason: params.dto.reason,
                onBehalfOfDriverId: trip.assignedDriverId,
                tripId: params.tripId,
                incidentType: params.dto.incidentType,
                severity: params.dto.severity,
            },
        });
        const driverUser = await this.prisma.user.findFirst({
            where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
            select: { id: true },
        });
        if (driverUser) {
            await this.notifications.create({
                tenantId: trip.tenantId,
                userId: driverUser.id,
                type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                title: 'Incident recorded on your behalf',
                body: `A coordinator created an incident for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
                payloadJson: { tripId: trip.id, incidentId: incident.id },
            });
        }
        return incident;
    }
    async proxyIncidentUpdate(params) {
        const incident = await this.prisma.tripIncident.findFirst({
            where: { id: params.incidentId },
            include: { trip: { select: { id: true, internalRef: true, tenantId: true, assignedDriverId: true } } },
        });
        if (!incident || incident.trip.tenantId !== params.tenantId)
            throw new common_1.NotFoundException('Incident not found');
        const update = await this.incidents.addUpdate(params.userId, params.tenantId, params.incidentId, { newStatus: params.dto.newStatus, comment: params.dto.comment });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'UPDATE',
            entityType: 'INCIDENT_UPDATE_PROXY',
            entityId: params.incidentId,
            changesJson: {
                reason: params.dto.reason,
                tripId: incident.trip.id,
                assignedDriverId: incident.trip.assignedDriverId,
                newStatus: params.dto.newStatus,
                comment: params.dto.comment,
            },
        });
        if (incident.trip.assignedDriverId) {
            const driverUser = await this.prisma.user.findFirst({
                where: { tenantId: params.tenantId, driverId: incident.trip.assignedDriverId, status: 'ACTIVE' },
                select: { id: true },
            });
            if (driverUser) {
                await this.notifications.create({
                    tenantId: params.tenantId,
                    userId: driverUser.id,
                    type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                    title: 'Incident update recorded',
                    body: `A coordinator updated incident for trip ${incident.trip.internalRef}. Reason: ${params.dto.reason}`,
                    payloadJson: { tripId: incident.trip.id, incidentId: params.incidentId },
                });
            }
        }
        return update;
    }
    async proxyIncidentResolve(params) {
        const incident = await this.prisma.tripIncident.findFirst({
            where: { id: params.incidentId },
            include: { trip: { select: { id: true, internalRef: true, tenantId: true, assignedDriverId: true } } },
        });
        if (!incident || incident.trip.tenantId !== params.tenantId)
            throw new common_1.NotFoundException('Incident not found');
        const resolved = await this.incidents.resolve(params.userId, params.tenantId, params.incidentId, {
            resolutionNotes: params.dto.resolutionNotes,
            replacementTripId: params.dto.replacementTripId,
        });
        await this.audit.log({
            tenantId: params.tenantId,
            userId: params.userId,
            action: 'UPDATE',
            entityType: 'INCIDENT_RESOLVE_PROXY',
            entityId: params.incidentId,
            changesJson: {
                reason: params.dto.reason,
                tripId: incident.trip.id,
                onBehalfOfDriverId: incident.trip.assignedDriverId,
                resolutionNotes: params.dto.resolutionNotes,
            },
        });
        if (incident.trip.assignedDriverId) {
            const driverUser = await this.prisma.user.findFirst({
                where: { tenantId: params.tenantId, driverId: incident.trip.assignedDriverId, status: 'ACTIVE' },
                select: { id: true },
            });
            if (driverUser) {
                await this.notifications.create({
                    tenantId: params.tenantId,
                    userId: driverUser.id,
                    type: client_1.NotificationType.MANUAL_UPDATE_NOTICE,
                    title: 'Incident resolved on your behalf',
                    body: `A coordinator resolved the incident for trip ${incident.trip.internalRef}. Reason: ${params.dto.reason}`,
                    payloadJson: { tripId: incident.trip.id, incidentId: params.incidentId },
                });
            }
        }
        return resolved;
    }
    async getDriverAvailability(tenantId, query) {
        const dayStart = (dateIso) => {
            const d = new Date(dateIso);
            return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
        };
        const effectiveFrom = query.date ? dayStart(query.date) : query.from ? dayStart(query.from) : undefined;
        const effectiveTo = query.date ? dayStart(query.date) : query.to ? dayStart(query.to) : undefined;
        return this.prisma.driverAvailability.findMany({
            where: {
                tenantId,
                ...(query.status && { status: query.status }),
                ...(query.codingDay !== undefined && { codingDay: query.codingDay }),
                ...(effectiveFrom && effectiveTo
                    ? { date: { gte: effectiveFrom, lte: effectiveTo } }
                    : effectiveFrom
                        ? { date: { gte: effectiveFrom } }
                        : {}),
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        phone: true,
                        spxDriverId: true,
                        status: true,
                    },
                },
            },
            orderBy: [{ date: 'asc' }, { updatedAt: 'desc' }],
            take: 1000,
        });
    }
    async search(tenantId, q) {
        const term = (q || '').trim();
        if (term.length < 2) {
            return { trips: [], drivers: [], operators: [] };
        }
        const [trips, drivers, operators] = await Promise.all([
            this.prisma.trip.findMany({
                where: {
                    tenantId,
                    internalRef: { contains: term, mode: 'insensitive' },
                },
                select: { id: true, internalRef: true, runsheetDate: true },
                orderBy: { createdAt: 'desc' },
                take: SEARCH_LIMIT,
            }),
            this.prisma.driver.findMany({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    OR: [
                        { firstName: { contains: term, mode: 'insensitive' } },
                        { lastName: { contains: term, mode: 'insensitive' } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true },
                take: SEARCH_LIMIT,
            }),
            this.prisma.operator.findMany({
                where: {
                    tenantId,
                    status: 'ACTIVE',
                    name: { contains: term, mode: 'insensitive' },
                },
                select: { id: true, name: true },
                take: SEARCH_LIMIT,
            }),
        ]);
        return { trips, drivers, operators };
    }
    async getOperationsDashboard(tenantId, query) {
        const baseWhere = { tenantId };
        if (query.clientAccountId)
            baseWhere.clientAccountId = query.clientAccountId;
        if (query.serviceCategoryId)
            baseWhere.serviceCategoryId = query.serviceCategoryId;
        if (query.operatorId)
            baseWhere.operatorIdAtAssignment = query.operatorId;
        if (query.driverId)
            baseWhere.assignedDriverId = query.driverId;
        if (query.originArea)
            baseWhere.originArea = query.originArea;
        if (query.destinationArea)
            baseWhere.destinationArea = query.destinationArea;
        if (query.dateFrom || query.dateTo) {
            baseWhere.runsheetDate = {};
            if (query.dateFrom)
                baseWhere.runsheetDate.gte = new Date(query.dateFrom);
            if (query.dateTo)
                baseWhere.runsheetDate.lte = new Date(query.dateTo);
        }
        if (query.assignmentStatus)
            baseWhere.assignmentStatus = query.assignmentStatus;
        if (query.highLevelTripStatus)
            baseWhere.highLevelTripStatus = query.highLevelTripStatus;
        if (query.podStatus)
            baseWhere.podStatus = query.podStatus;
        const notCancelled = { highLevelTripStatus: { not: client_1.HighLevelTripStatus.CANCELLED } };
        const tripSelect = {
            id: true,
            internalRef: true,
            runsheetDate: true,
            callTime: true,
            assignmentStatus: true,
            highLevelTripStatus: true,
            podStatus: true,
            lastDriverEventAt: true,
            assignedDriver: { select: { id: true, firstName: true, lastName: true } },
            serviceCategory: { select: { id: true, name: true, code: true } },
        };
        const now = new Date();
        const threeHoursMs = 3 * 60 * 60 * 1000;
        const [pendingAcceptanceCount, pendingAcceptanceTrips, acceptedOngoingCount, completedCount, podUploadedPendingReviewCount, podRejectedCount, podVerifiedCount, financeDocReceivedCount, noUpdateCandidates, openIncidents,] = await Promise.all([
            this.prisma.trip.count({
                where: {
                    ...baseWhere,
                    ...notCancelled,
                    assignmentStatus: client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
                    assignedDriverId: { not: null },
                },
            }),
            this.prisma.trip.findMany({
                where: {
                    ...baseWhere,
                    ...notCancelled,
                    assignmentStatus: client_1.AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
                    assignedDriverId: { not: null },
                },
                select: tripSelect,
                orderBy: { callTime: 'asc' },
                take: 50,
            }),
            this.prisma.trip.count({
                where: {
                    ...baseWhere,
                    ...notCancelled,
                    assignmentStatus: client_1.AssignmentStatus.ACCEPTED,
                    highLevelTripStatus: { notIn: [client_1.HighLevelTripStatus.COMPLETED, client_1.HighLevelTripStatus.CANCELLED] },
                },
            }),
            this.prisma.trip.count({
                where: { ...baseWhere, highLevelTripStatus: client_1.HighLevelTripStatus.COMPLETED },
            }),
            this.prisma.trip.count({
                where: { ...baseWhere, podStatus: client_1.PODStatus.POD_UPLOADED_PENDING_REVIEW },
            }),
            this.prisma.trip.count({
                where: { ...baseWhere, podStatus: client_1.PODStatus.POD_REJECTED_NEEDS_REUPLOAD },
            }),
            this.prisma.trip.count({
                where: { ...baseWhere, podStatus: client_1.PODStatus.POD_VERIFIED },
            }),
            this.prisma.trip.count({
                where: {
                    ...baseWhere,
                    podStatus: client_1.PODStatus.POD_VERIFIED,
                    finance: { financeDocReceivedAt: { not: null } },
                },
            }),
            this.prisma.trip.findMany({
                where: {
                    ...baseWhere,
                    ...notCancelled,
                    assignmentStatus: client_1.AssignmentStatus.ACCEPTED,
                    highLevelTripStatus: { notIn: [client_1.HighLevelTripStatus.COMPLETED, client_1.HighLevelTripStatus.CANCELLED] },
                    callTime: { lte: now },
                },
                select: { ...tripSelect, callTime: true, lastDriverEventAt: true },
                orderBy: { callTime: 'asc' },
                take: 100,
            }),
            this.prisma.tripIncident.findMany({
                where: {
                    trip: baseWhere,
                    status: query.incidentStatus ?? { in: [client_1.IncidentStatus.OPEN, client_1.IncidentStatus.ACKNOWLEDGED, client_1.IncidentStatus.IN_PROGRESS] },
                    ...(query.incidentSeverity && { severity: query.incidentSeverity }),
                },
                select: {
                    id: true,
                    tripId: true,
                    incidentType: true,
                    severity: true,
                    status: true,
                    description: true,
                    reportedAt: true,
                    trip: { select: { id: true, internalRef: true } },
                },
                orderBy: { reportedAt: 'desc' },
                take: 50,
            }),
        ]);
        const noUpdateTrips = noUpdateCandidates.filter((t) => {
            const windowStart = new Date(t.callTime.getTime() - threeHoursMs);
            return !t.lastDriverEventAt || t.lastDriverEventAt < windowStart;
        }).slice(0, 50);
        return {
            counts: {
                pendingAcceptance: pendingAcceptanceCount,
                acceptedOngoing: acceptedOngoingCount,
                completed: completedCount,
                podUploadedPendingReview: podUploadedPendingReviewCount,
                podRejected: podRejectedCount,
                podVerified: podVerifiedCount,
                financeDocReceived: financeDocReceivedCount,
                noUpdateCallTime: noUpdateTrips.length,
            },
            pendingAcceptanceTrips,
            noUpdateCallTimeTrips: noUpdateTrips,
            openIncidents,
        };
    }
};
exports.DispatchService = DispatchService;
exports.DispatchService = DispatchService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        notifications_service_1.NotificationsService,
        incidents_service_1.IncidentsService,
        barcode_cover_service_1.BarcodeCoverService,
        rates_service_1.RatesService])
], DispatchService);
//# sourceMappingURL=dispatch.service.js.map