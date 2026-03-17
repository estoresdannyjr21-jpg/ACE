import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  PODStatus,
  AssignmentStatus,
  DocumentType,
  EventType,
  HighLevelTripStatus,
  IncidentSeverity,
  IncidentStatus,
  NotificationType,
} from '@prisma/client';
import { CreateTripDto, VerifyPODDto, RejectPODDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import { NotificationsService } from '../notifications/notifications.service';
import { IncidentsService } from '../incidents/incidents.service';
import { BarcodeCoverService } from '../barcode-cover/barcode-cover.service';
import { RatesService } from '../rates/rates.service';

const RATE_EXPIRY_WARNING_DAYS = 7;
const SEARCH_LIMIT = 10;

@Injectable()
export class DispatchService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private notifications: NotificationsService,
    private incidents: IncidentsService,
    private barcodeCover: BarcodeCoverService,
    private ratesService: RatesService,
  ) {}

  async getLookups(tenantId: string) {
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

    return { clients, drivers, vehicles, operators };
  }

  async createTrip(userId: string, tenantId: string, dto: CreateTripDto) {
    // Get driver's active operator assignment
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
      throw new NotFoundException('Driver not found');
    }

    if (!driver.assignments.length) {
      throw new BadRequestException('Driver has no active operator assignment');
    }

    const operatorId = driver.assignments[0].operatorId;

    // Verify vehicle belongs to same operator
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
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.assignments.length || vehicle.assignments[0].operatorId !== operatorId) {
      throw new BadRequestException('Vehicle must be assigned to the same operator as the driver');
    }

    // Generate internal reference
    const internalRef = `TR-${Date.now()}-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Get service category to determine segment type
    const serviceCategory = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.serviceCategoryId },
    });

    if (!serviceCategory) {
      throw new NotFoundException('Service category not found');
    }

    const runsheetDate = new Date(dto.runsheetDate);
    const activeRate = await this.ratesService.getActiveRateForTrip(
      tenantId,
      dto.clientAccountId,
      dto.serviceCategoryId,
      dto.originArea,
      dto.destinationArea,
      runsheetDate,
    );
    if (!activeRate) {
      throw new BadRequestException(
        'No active route rate for this trip date and route. Add a rate or extend the effective period before creating the trip.',
      );
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
        assignmentStatus: AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
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

    const rateExpiryWarning =
      activeRate.effectiveEnd &&
      new Date(activeRate.effectiveEnd).getTime() - runsheetDate.getTime() <=
        RATE_EXPIRY_WARNING_DAYS * 24 * 60 * 60 * 1000;
    return { trip, rateExpiryWarning: !!rateExpiryWarning };
  }

  async getTrips(
    tenantId: string,
    query?: {
      dateFrom?: string;
      dateTo?: string;
      assignmentStatus?: AssignmentStatus;
      highLevelTripStatus?: HighLevelTripStatus;
      podStatus?: PODStatus;
      clientAccountId?: string;
      internalRef?: string;
    },
  ) {
    const where: any = { tenantId };
    if (query?.dateFrom || query?.dateTo) {
      where.runsheetDate = {};
      if (query.dateFrom) where.runsheetDate.gte = new Date(query.dateFrom);
      if (query.dateTo) where.runsheetDate.lte = new Date(query.dateTo);
    }
    if (query?.assignmentStatus) where.assignmentStatus = query.assignmentStatus;
    if (query?.highLevelTripStatus) where.highLevelTripStatus = query.highLevelTripStatus;
    if (query?.podStatus) where.podStatus = query.podStatus;
    if (query?.clientAccountId) where.clientAccountId = query.clientAccountId;
    if (query?.internalRef) where.internalRef = { contains: query.internalRef, mode: 'insensitive' };

    return this.prisma.trip.findMany({
      where,
      include: {
        assignedDriver: true,
        assignedVehicle: true,
        serviceCategory: true,
        clientAccount: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getTripById(tenantId: string, tripId: string) {
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
      throw new NotFoundException('Trip not found');
    }

    return trip;
  }

  async verifyPOD(userId: string, tenantId: string, tripId: string, dto: VerifyPODDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.podStatus !== PODStatus.POD_UPLOADED_PENDING_REVIEW) {
      throw new BadRequestException('POD is not in pending review status');
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        podStatus: PODStatus.POD_VERIFIED,
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

    // Blueprint §6: Barcode cover sheet – generate PDF and create document record on POD verify.
    const tripForBarcode = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        clientAccount: { select: { name: true, code: true } },
        serviceCategory: { select: { name: true, code: true } },
        assignedDriver: { select: { firstName: true, lastName: true } },
        assignedVehicle: { select: { plateNumber: true } },
      },
    });
    let fileKey: string;
    if (tripForBarcode) {
      const result = await this.barcodeCover.generateAndSave(tripForBarcode);
      fileKey = result.fileKey;
    } else {
      fileKey = `barcode-cover/${tripId}/${updated.internalRef}-${Date.now()}.pdf`;
    }
    await this.prisma.tripDocument.create({
      data: {
        tripId,
        docType: DocumentType.BARCODE_COVER_SHEET,
        fileKey,
        uploadedByUserId: userId,
      },
    });

    return updated;
  }

  async rejectPOD(userId: string, tenantId: string, tripId: string, dto: RejectPODDto) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.podStatus !== PODStatus.POD_UPLOADED_PENDING_REVIEW) {
      throw new BadRequestException('POD is not in pending review status');
    }

    const updated = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        podStatus: PODStatus.POD_REJECTED_NEEDS_REUPLOAD,
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

    // TODO: Send notification to driver
    // This will be implemented in notifications module

    return updated;
  }

  async proxyCreateTripEvent(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    dto: {
      reason: string;
      eventType: EventType;
      eventTime: string;
      stopId?: string;
      gpsLat?: number;
      gpsLng?: number;
      gpsAccuracy?: number;
      capturedOffline?: boolean;
      mediaFileKeys: string[];
    };
  }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId },
      select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.assignedDriverId) throw new BadRequestException('Trip has no assigned driver');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before encoding events on behalf of driver');
    }
    if (!params.dto.mediaFileKeys?.length) {
      throw new BadRequestException('At least one media file key is required');
    }

    if (params.dto.stopId) {
      const stop = await this.prisma.tripStop.findFirst({
        where: { id: params.dto.stopId, tripId: params.tripId },
        select: { id: true },
      });
      if (!stop) throw new BadRequestException('Stop not found for this trip');
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
        createdByUserId: params.userId, // coordinator user id (performedBy)
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

    // Notify driver user for transparency
    const driverUser = await this.prisma.user.findFirst({
      where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
      select: { id: true },
    });
    if (driverUser) {
      await this.notifications.create({
        tenantId: trip.tenantId,
        userId: driverUser.id,
        type: NotificationType.MANUAL_UPDATE_NOTICE,
        title: 'Manual update recorded',
        body: `A coordinator encoded an update for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
        payloadJson: { tripId: trip.id },
      });
    }

    return this.prisma.tripEvent.findFirst({ where: { id: event.id }, include: { media: true } });
  }

  async proxyUploadPod(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    dto: { reason: string; fileKey: string };
  }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId },
      select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.assignedDriverId) throw new BadRequestException('Trip has no assigned driver');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before uploading POD on behalf of driver');
    }

    await this.prisma.tripDocument.create({
      data: {
        tripId: params.tripId,
        docType: DocumentType.POD_RUNSHEET,
        fileKey: params.dto.fileKey,
        uploadedByUserId: params.userId, // coordinator (performedBy)
      },
    });

    const updated = await this.prisma.trip.update({
      where: { id: params.tripId },
      data: { podStatus: PODStatus.POD_UPLOADED_PENDING_REVIEW },
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
        type: NotificationType.MANUAL_UPDATE_NOTICE,
        title: 'Manual POD upload recorded',
        body: `A coordinator uploaded the POD/Runsheet for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
        payloadJson: { tripId: trip.id },
      });
    }

    return updated;
  }

  async proxyUploadReimbursableDoc(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    dto: { reason: string; docType: 'TOLL' | 'GAS' | 'PARKING'; fileKey: string };
  }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId },
      select: { id: true, internalRef: true, assignmentStatus: true, assignedDriverId: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.assignedDriverId) throw new BadRequestException('Trip has no assigned driver');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before uploading reimbursable doc on behalf of driver');
    }

    const docTypeMap = { TOLL: DocumentType.TOLL, GAS: DocumentType.GAS, PARKING: DocumentType.PARKING } as const;
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
        type: NotificationType.MANUAL_UPDATE_NOTICE,
        title: 'Manual reimbursable doc upload',
        body: `A coordinator uploaded a ${params.dto.docType} doc for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
        payloadJson: { tripId: trip.id },
      });
    }

    return doc;
  }

  async proxyCreateIncident(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    dto: {
      reason: string;
      incidentType: any;
      severity: any;
      description: string;
      gpsLat?: number;
      gpsLng?: number;
      gpsAccuracy?: number;
    };
  }) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId },
      select: { id: true, internalRef: true, assignedDriverId: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (!trip.assignedDriverId) throw new BadRequestException('Trip has no assigned driver');

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
        type: NotificationType.MANUAL_UPDATE_NOTICE,
        title: 'Incident recorded on your behalf',
        body: `A coordinator created an incident for trip ${trip.internalRef}. Reason: ${params.dto.reason}`,
        payloadJson: { tripId: trip.id, incidentId: incident.id },
      });
    }

    return incident;
  }

  async proxyIncidentUpdate(params: {
    userId: string;
    tenantId: string;
    incidentId: string;
    dto: { reason: string; newStatus?: any; comment?: string };
  }) {
    const incident = await this.prisma.tripIncident.findFirst({
      where: { id: params.incidentId },
      include: { trip: { select: { id: true, internalRef: true, tenantId: true, assignedDriverId: true } } },
    });
    if (!incident || incident.trip.tenantId !== params.tenantId) throw new NotFoundException('Incident not found');

    const update = await this.incidents.addUpdate(
      params.userId,
      params.tenantId,
      params.incidentId,
      { newStatus: params.dto.newStatus, comment: params.dto.comment },
    );

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
          type: NotificationType.MANUAL_UPDATE_NOTICE,
          title: 'Incident update recorded',
          body: `A coordinator updated incident for trip ${incident.trip.internalRef}. Reason: ${params.dto.reason}`,
          payloadJson: { tripId: incident.trip.id, incidentId: params.incidentId },
        });
      }
    }

    return update;
  }

  async proxyIncidentResolve(params: {
    userId: string;
    tenantId: string;
    incidentId: string;
    dto: { reason: string; resolutionNotes: string; replacementTripId?: string };
  }) {
    const incident = await this.prisma.tripIncident.findFirst({
      where: { id: params.incidentId },
      include: { trip: { select: { id: true, internalRef: true, tenantId: true, assignedDriverId: true } } },
    });
    if (!incident || incident.trip.tenantId !== params.tenantId) throw new NotFoundException('Incident not found');

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
          type: NotificationType.MANUAL_UPDATE_NOTICE,
          title: 'Incident resolved on your behalf',
          body: `A coordinator resolved the incident for trip ${incident.trip.internalRef}. Reason: ${params.dto.reason}`,
          payloadJson: { tripId: incident.trip.id, incidentId: params.incidentId },
        });
      }
    }

    return resolved;
  }

  async getDriverAvailability(
    tenantId: string,
    query: { date?: string; from?: string; to?: string; status?: any; codingDay?: any },
  ) {
    const dayStart = (dateIso: string) => {
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

  async search(tenantId: string, q: string) {
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

  async getOperationsDashboard(
    tenantId: string,
    query: {
      clientAccountId?: string;
      serviceCategoryId?: string;
      operatorId?: string;
      driverId?: string;
      dateFrom?: string;
      dateTo?: string;
      assignmentStatus?: AssignmentStatus;
      highLevelTripStatus?: HighLevelTripStatus;
      podStatus?: PODStatus;
      originArea?: string;
      destinationArea?: string;
      incidentStatus?: IncidentStatus;
      incidentSeverity?: IncidentSeverity;
    },
  ) {
    const baseWhere: any = { tenantId };
    if (query.clientAccountId) baseWhere.clientAccountId = query.clientAccountId;
    if (query.serviceCategoryId) baseWhere.serviceCategoryId = query.serviceCategoryId;
    if (query.operatorId) baseWhere.operatorIdAtAssignment = query.operatorId;
    if (query.driverId) baseWhere.assignedDriverId = query.driverId;
    if (query.originArea) baseWhere.originArea = query.originArea;
    if (query.destinationArea) baseWhere.destinationArea = query.destinationArea;
    if (query.dateFrom || query.dateTo) {
      baseWhere.runsheetDate = {};
      if (query.dateFrom) baseWhere.runsheetDate.gte = new Date(query.dateFrom);
      if (query.dateTo) baseWhere.runsheetDate.lte = new Date(query.dateTo);
    }
    if (query.assignmentStatus) baseWhere.assignmentStatus = query.assignmentStatus;
    if (query.highLevelTripStatus) baseWhere.highLevelTripStatus = query.highLevelTripStatus;
    if (query.podStatus) baseWhere.podStatus = query.podStatus;

    const notCancelled = { highLevelTripStatus: { not: HighLevelTripStatus.CANCELLED } };
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

    const [
      pendingAcceptanceCount,
      pendingAcceptanceTrips,
      acceptedOngoingCount,
      completedCount,
      podUploadedPendingReviewCount,
      podRejectedCount,
      podVerifiedCount,
      financeDocReceivedCount,
      noUpdateCandidates,
      openIncidents,
    ] = await Promise.all([
      this.prisma.trip.count({
        where: {
          ...baseWhere,
          ...notCancelled,
          assignmentStatus: AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
          assignedDriverId: { not: null },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          ...baseWhere,
          ...notCancelled,
          assignmentStatus: AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
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
          assignmentStatus: AssignmentStatus.ACCEPTED,
          highLevelTripStatus: { notIn: [HighLevelTripStatus.COMPLETED, HighLevelTripStatus.CANCELLED] },
        },
      }),
      this.prisma.trip.count({
        where: { ...baseWhere, highLevelTripStatus: HighLevelTripStatus.COMPLETED },
      }),
      this.prisma.trip.count({
        where: { ...baseWhere, podStatus: PODStatus.POD_UPLOADED_PENDING_REVIEW },
      }),
      this.prisma.trip.count({
        where: { ...baseWhere, podStatus: PODStatus.POD_REJECTED_NEEDS_REUPLOAD },
      }),
      this.prisma.trip.count({
        where: { ...baseWhere, podStatus: PODStatus.POD_VERIFIED },
      }),
      this.prisma.trip.count({
        where: {
          ...baseWhere,
          podStatus: PODStatus.POD_VERIFIED,
          finance: { financeDocReceivedAt: { not: null } },
        },
      }),
      this.prisma.trip.findMany({
        where: {
          ...baseWhere,
          ...notCancelled,
          assignmentStatus: AssignmentStatus.ACCEPTED,
          highLevelTripStatus: { notIn: [HighLevelTripStatus.COMPLETED, HighLevelTripStatus.CANCELLED] },
          callTime: { lte: now },
        },
        select: { ...tripSelect, callTime: true, lastDriverEventAt: true },
        orderBy: { callTime: 'asc' },
        take: 100,
      }),
      this.prisma.tripIncident.findMany({
        where: {
          trip: baseWhere,
          status: query.incidentStatus ?? { in: [IncidentStatus.OPEN, IncidentStatus.ACKNOWLEDGED, IncidentStatus.IN_PROGRESS] },
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

    // No-update: lastDriverEventAt < (callTime - 3h) requires raw filter per row; use in-memory filter for the list
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
}
