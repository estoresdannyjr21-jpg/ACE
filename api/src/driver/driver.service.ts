import { Injectable, ForbiddenException, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import {
  DriverAvailabilityStatus,
  Prisma,
  AssignmentStatus,
  NotificationType,
  UserRole,
  EventType,
  PODStatus,
  DocumentType,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class DriverService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async listMyAvailability(params: { userId: string; tenantId: string; driverId?: string | null; from?: string; to?: string }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }
    const where: Prisma.DriverAvailabilityWhereInput = {
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

  async setMyAvailability(params: {
    userId: string;
    tenantId: string;
    driverId?: string | null;
    items: { date: string; status: DriverAvailabilityStatus; note?: string; codingDay?: boolean }[];
  }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }
    if (!params.items.length) {
      throw new BadRequestException('No items provided');
    }

    // Upsert each day tag (one per date)
    const ops = params.items.map((i) =>
      this.prisma.driverAvailability.upsert({
        where: {
          tenantId_driverId_date: {
            tenantId: params.tenantId,
            driverId: params.driverId!,
            date: this.toDayStart(i.date),
          },
        },
        update: { status: i.status, codingDay: i.codingDay ?? false, note: i.note ?? null },
        create: {
          tenantId: params.tenantId,
          driverId: params.driverId!,
          date: this.toDayStart(i.date),
          status: i.status,
          codingDay: i.codingDay ?? false,
          note: i.note ?? null,
        },
      }),
    );

    return this.prisma.$transaction(ops);
  }

  async getMyTrips(params: {
    tenantId: string;
    driverId?: string | null;
    assignmentStatus?: AssignmentStatus;
    highLevelTripStatus?: any;
  }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
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

  async getMyTrip(params: { tenantId: string; driverId?: string | null; tripId: string }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
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
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  async acceptTrip(params: { tenantId: string; driverId?: string | null; tripId: string }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
      select: { id: true, assignmentStatus: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.assignmentStatus !== AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE) {
      throw new BadRequestException('Trip is not pending acceptance');
    }
    return this.prisma.trip.update({
      where: { id: params.tripId },
      data: {
        assignmentStatus: AssignmentStatus.ACCEPTED,
        acceptedAt: new Date(),
        declinedAt: null,
        declineReason: null,
      },
    });
  }

  async declineTrip(params: {
    tenantId: string;
    driverId?: string | null;
    tripId: string;
    reason?: string;
  }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }
    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
      select: { id: true, internalRef: true, assignmentStatus: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.assignmentStatus !== AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE) {
      throw new BadRequestException('Trip is not pending acceptance');
    }

    const updated = await this.prisma.trip.update({
      where: { id: params.tripId },
      data: {
        assignmentStatus: AssignmentStatus.DECLINED,
        declinedAt: new Date(),
        declineReason: params.reason ?? 'Declined by driver',
        acceptedAt: null,
      },
    });

    // Notify Operations Account Coordinators in the same tenant
    const coordinators = await this.prisma.user.findMany({
      where: { tenantId: trip.tenantId, role: UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
      select: { id: true },
      take: 50,
    });

    for (const u of coordinators) {
      await this.notifications.create({
        tenantId: trip.tenantId,
        userId: u.id,
        type: NotificationType.TRIP_DECLINED_ALERT,
        title: 'Trip declined by driver',
        body: `Trip ${trip.internalRef} was declined. Reason: ${params.reason ?? 'N/A'}`,
        payloadJson: { tripId: trip.id },
      });
    }

    return updated;
  }

  async createTripEvent(params: {
    userId: string;
    tenantId: string;
    driverId?: string | null;
    tripId: string;
    dto: {
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
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }

    const trip = await this.prisma.trip.findFirst({
      where: {
        id: params.tripId,
        tenantId: params.tenantId,
        assignedDriverId: params.driverId,
      },
      select: { id: true, assignmentStatus: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before submitting events');
    }

    if (!params.dto.mediaFileKeys?.length) {
      throw new BadRequestException('At least one media file key is required');
    }

    // Optional stop validation (must belong to same trip)
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

  async uploadPod(params: {
    userId: string;
    tenantId: string;
    driverId?: string | null;
    tripId: string;
    fileKey: string;
  }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }

    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
      select: { id: true, assignmentStatus: true, podStatus: true, internalRef: true, tenantId: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before uploading POD');
    }

    // Create trip document record for POD/Runsheet
    await this.prisma.tripDocument.create({
      data: {
        tripId: params.tripId,
        docType: DocumentType.POD_RUNSHEET,
        fileKey: params.fileKey,
        uploadedByUserId: params.userId,
      },
    });

    const updated = await this.prisma.trip.update({
      where: { id: params.tripId },
      data: {
        podStatus: PODStatus.POD_UPLOADED_PENDING_REVIEW,
      },
    });

    // Notify coordinators that POD is ready for review
    const coordinators = await this.prisma.user.findMany({
      where: { tenantId: trip.tenantId, role: UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
      select: { id: true },
      take: 50,
    });
    for (const u of coordinators) {
      await this.notifications.create({
        tenantId: trip.tenantId,
        userId: u.id,
        type: NotificationType.POD_UPLOADED_PENDING_REVIEW,
        title: 'POD uploaded, pending review',
        body: `Trip ${trip.internalRef} has a POD/Runsheet uploaded and needs verification.`,
        payloadJson: { tripId: trip.id },
      });
    }

    return updated;
  }

  async uploadReimbursableDoc(params: {
    userId: string;
    tenantId: string;
    driverId?: string | null;
    tripId: string;
    docType: 'TOLL' | 'GAS' | 'PARKING';
    fileKey: string;
  }) {
    if (!params.driverId) {
      throw new ForbiddenException('Driver user is not linked to a driver');
    }

    const trip = await this.prisma.trip.findFirst({
      where: { id: params.tripId, tenantId: params.tenantId, assignedDriverId: params.driverId },
      select: { id: true, assignmentStatus: true },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new BadRequestException('Trip must be accepted before uploading reimbursable docs');
    }

    const docTypeMap = { TOLL: DocumentType.TOLL, GAS: DocumentType.GAS, PARKING: DocumentType.PARKING } as const;
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

  private toDayStart(dateIso: string) {
    // Store as midnight UTC to represent a day; app TZ handling can be done at the edge.
    const d = new Date(dateIso);
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
}

