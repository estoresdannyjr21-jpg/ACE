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
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let IncidentsService = class IncidentsService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async findMany(tenantId, query) {
        const where = { trip: { tenantId } };
        if (query.status)
            where.status = query.status;
        if (query.severity)
            where.severity = query.severity;
        if (query.tripId)
            where.tripId = query.tripId;
        if (query.dateFrom || query.dateTo) {
            where.reportedAt = {};
            if (query.dateFrom)
                where.reportedAt.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.reportedAt.lte = new Date(query.dateTo);
        }
        return this.prisma.tripIncident.findMany({
            where,
            include: {
                trip: { select: { id: true, internalRef: true, runsheetDate: true } },
                reporter: { select: { id: true, firstName: true, lastName: true } },
            },
            orderBy: { reportedAt: 'desc' },
            take: 500,
        });
    }
    async create(userId, tenantId, dto) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: dto.tripId, tenantId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        const incident = await this.prisma.tripIncident.create({
            data: {
                tripId: dto.tripId,
                reportedByUserId: userId,
                incidentType: dto.incidentType,
                severity: dto.severity,
                description: dto.description,
                gpsLat: dto.gpsLat,
                gpsLng: dto.gpsLng,
                gpsAccuracy: dto.gpsAccuracy,
            },
            include: {
                trip: { select: { id: true, internalRef: true } },
                reporter: { select: { id: true, firstName: true, lastName: true } },
            },
        });
        await this.prisma.trip.update({
            where: { id: dto.tripId },
            data: { lastDriverEventAt: new Date() },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'CREATE',
            entityType: 'INCIDENT_CREATE',
            entityId: incident.id,
            changesJson: { tripId: dto.tripId, incidentType: dto.incidentType, severity: dto.severity },
        });
        return incident;
    }
    async findByTrip(tenantId, tripId) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        return this.prisma.tripIncident.findMany({
            where: { tripId },
            include: {
                reporter: { select: { id: true, firstName: true, lastName: true } },
                resolver: { select: { id: true, firstName: true, lastName: true } },
                media: true,
                updates: { orderBy: { updateAt: 'desc' }, include: { updater: { select: { firstName: true, lastName: true } } } },
            },
            orderBy: { reportedAt: 'desc' },
        });
    }
    async findOne(tenantId, incidentId) {
        const incident = await this.prisma.tripIncident.findFirst({
            where: { id: incidentId },
            include: {
                trip: { select: { id: true, internalRef: true, tenantId: true } },
                reporter: { select: { id: true, firstName: true, lastName: true } },
                resolver: { select: { id: true, firstName: true, lastName: true } },
                replacementTrip: { select: { id: true, internalRef: true } },
                media: true,
                updates: { orderBy: { updateAt: 'desc' }, include: { updater: { select: { firstName: true, lastName: true } } } },
            },
        });
        if (!incident || incident.trip.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Incident not found');
        }
        return incident;
    }
    async addUpdate(userId, tenantId, incidentId, dto) {
        const incident = await this.getIncidentForTenant(incidentId, tenantId);
        const update = await this.prisma.tripIncidentUpdate.create({
            data: {
                incidentId,
                updatedByUserId: userId,
                newStatus: dto.newStatus,
                comment: dto.comment,
            },
            include: { updater: { select: { firstName: true, lastName: true } } },
        });
        if (dto.newStatus) {
            await this.prisma.tripIncident.update({
                where: { id: incidentId },
                data: { status: dto.newStatus },
            });
        }
        return update;
    }
    async resolve(userId, tenantId, incidentId, dto) {
        const incident = await this.getIncidentForTenant(incidentId, tenantId);
        if (incident.status === client_1.IncidentStatus.CLOSED || incident.status === client_1.IncidentStatus.RESOLVED) {
            throw new common_1.BadRequestException('Incident is already resolved or closed');
        }
        if (dto.replacementTripId) {
            const replacement = await this.prisma.trip.findFirst({
                where: { id: dto.replacementTripId, tenantId },
            });
            if (!replacement) {
                throw new common_1.NotFoundException('Replacement trip not found');
            }
        }
        const updated = await this.prisma.tripIncident.update({
            where: { id: incidentId },
            data: {
                status: client_1.IncidentStatus.RESOLVED,
                resolvedByUserId: userId,
                resolvedAt: new Date(),
                resolutionNotes: dto.resolutionNotes,
                replacementTripId: dto.replacementTripId ?? undefined,
            },
            include: {
                trip: { select: { id: true, internalRef: true } },
                resolver: { select: { id: true, firstName: true, lastName: true } },
                replacementTrip: { select: { id: true, internalRef: true } },
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'INCIDENT_RESOLVE',
            entityId: incidentId,
            changesJson: { resolutionNotes: dto.resolutionNotes, replacementTripId: dto.replacementTripId },
        });
        return updated;
    }
    async close(tenantId, incidentId) {
        const incident = await this.getIncidentForTenant(incidentId, tenantId);
        if (incident.status !== client_1.IncidentStatus.RESOLVED) {
            throw new common_1.BadRequestException('Incident must be resolved before closing');
        }
        return this.prisma.tripIncident.update({
            where: { id: incidentId },
            data: { status: client_1.IncidentStatus.CLOSED },
            include: { trip: { select: { id: true, internalRef: true } } },
        });
    }
    async addMedia(tenantId, incidentId, dto) {
        await this.getIncidentForTenant(incidentId, tenantId);
        return this.prisma.tripIncidentMedia.create({
            data: {
                incidentId,
                fileKey: dto.fileKey,
            },
        });
    }
    async getIncidentForTenant(incidentId, tenantId) {
        const incident = await this.prisma.tripIncident.findFirst({
            where: { id: incidentId },
            include: { trip: { select: { tenantId: true } } },
        });
        if (!incident || incident.trip.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Incident not found');
        }
        return incident;
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map