import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IncidentStatus, IncidentSeverity } from '@prisma/client';
import {
  CreateIncidentDto,
  AddIncidentUpdateDto,
  ResolveIncidentDto,
  AddIncidentMediaDto,
} from './dto';

@Injectable()
export class IncidentsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async findMany(
    tenantId: string,
    query: {
      status?: IncidentStatus;
      severity?: IncidentSeverity;
      tripId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: any = { trip: { tenantId } };
    if (query.status) where.status = query.status;
    if (query.severity) where.severity = query.severity;
    if (query.tripId) where.tripId = query.tripId;
    if (query.dateFrom || query.dateTo) {
      where.reportedAt = {};
      if (query.dateFrom) where.reportedAt.gte = new Date(query.dateFrom);
      if (query.dateTo) where.reportedAt.lte = new Date(query.dateTo);
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

  async create(userId: string, tenantId: string, dto: CreateIncidentDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: dto.tripId, tenantId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
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

  async findByTrip(tenantId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
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

  async findOne(tenantId: string, incidentId: string) {
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
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }

  async addUpdate(
    userId: string,
    tenantId: string,
    incidentId: string,
    dto: AddIncidentUpdateDto,
  ) {
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

  async resolve(
    userId: string,
    tenantId: string,
    incidentId: string,
    dto: ResolveIncidentDto,
  ) {
    const incident = await this.getIncidentForTenant(incidentId, tenantId);

    if (incident.status === IncidentStatus.CLOSED || incident.status === IncidentStatus.RESOLVED) {
      throw new BadRequestException('Incident is already resolved or closed');
    }

    if (dto.replacementTripId) {
      const replacement = await this.prisma.trip.findFirst({
        where: { id: dto.replacementTripId, tenantId },
      });
      if (!replacement) {
        throw new NotFoundException('Replacement trip not found');
      }
    }

    const updated = await this.prisma.tripIncident.update({
      where: { id: incidentId },
      data: {
        status: IncidentStatus.RESOLVED,
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

  async close(tenantId: string, incidentId: string) {
    const incident = await this.getIncidentForTenant(incidentId, tenantId);
    if (incident.status !== IncidentStatus.RESOLVED) {
      throw new BadRequestException('Incident must be resolved before closing');
    }

    return this.prisma.tripIncident.update({
      where: { id: incidentId },
      data: { status: IncidentStatus.CLOSED },
      include: { trip: { select: { id: true, internalRef: true } } },
    });
  }

  async addMedia(
    tenantId: string,
    incidentId: string,
    dto: AddIncidentMediaDto,
  ) {
    await this.getIncidentForTenant(incidentId, tenantId);

    return this.prisma.tripIncidentMedia.create({
      data: {
        incidentId,
        fileKey: dto.fileKey,
      },
    });
  }

  private async getIncidentForTenant(incidentId: string, tenantId: string) {
    const incident = await this.prisma.tripIncident.findFirst({
      where: { id: incidentId },
      include: { trip: { select: { tenantId: true } } },
    });
    if (!incident || incident.trip.tenantId !== tenantId) {
      throw new NotFoundException('Incident not found');
    }
    return incident;
  }
}
