import {
  Injectable,
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  AssignmentStatus,
  DocumentType,
  HighLevelTripStatus,
  PODStatus,
  Prisma,
  TripCompletionSource,
  TripRequirementKind,
} from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';

export type FulfillRequirementItem = {
  /** Requirement code (e.g. SEAL_NUMBER) or requirement id */
  code?: string;
  requirementId?: string;
  /** Typed value for FIELD requirements */
  value?: string;
  /** Uploaded file key for DOCUMENT requirements */
  fileKey?: string;
};

type TripForRequirements = Prisma.TripGetPayload<{
  include: { serviceCategory: { select: { id: true; code: true } } };
}>;

/**
 * Evaluates and records the per-client trip requirements (ClientTripRequirement)
 * that gate trip completion, and performs the completion itself.
 *
 * Drivers and coordinators must satisfy every active required item; only an admin
 * force-complete bypasses the checks.
 */
@Injectable()
export class TripRequirementsService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  /** Requirement checklist for a trip, with what is still missing. */
  async getStatus(params: { tenantId: string; tripId: string; driverId?: string | null }) {
    const trip = await this.loadTrip(params);
    const items = await this.buildChecklist(trip);
    const missing = items.filter((i) => i.required && !i.fulfilled);

    return {
      tripId: trip.id,
      internalRef: trip.internalRef,
      clientAccountId: trip.clientAccountId,
      serviceCategoryCode: trip.serviceCategory.code,
      highLevelTripStatus: trip.highLevelTripStatus,
      completedAt: trip.completedAt,
      completionSource: trip.completionSource,
      requirements: items,
      missing: missing.map((m) => ({ code: m.code, label: m.label, kind: m.kind })),
      canComplete: missing.length === 0,
    };
  }

  /**
   * Record requirement values / documents. `source` records who satisfied them
   * (driver themselves, or a coordinator acting on the driver's behalf).
   */
  async fulfill(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    source: TripCompletionSource;
    items: FulfillRequirementItem[];
    driverId?: string | null;
  }) {
    if (!params.items?.length) {
      throw new BadRequestException('At least one requirement item is required');
    }

    const trip = await this.loadTrip(params);
    this.assertTripOpen(trip);
    if (params.source === TripCompletionSource.DRIVER) {
      this.assertDriverAccepted(trip);
    }

    const requirements = await this.loadRequirements(trip);
    const byCode = new Map(requirements.map((r) => [r.code, r]));
    const byId = new Map(requirements.map((r) => [r.id, r]));

    const resolved = params.items.map((item) => {
      const requirement = item.requirementId
        ? byId.get(item.requirementId)
        : item.code
          ? byCode.get(item.code)
          : undefined;
      if (!requirement) {
        throw new BadRequestException(
          `Requirement "${item.requirementId ?? item.code}" is not configured for this client and service category`,
        );
      }
      if (requirement.kind === TripRequirementKind.DOCUMENT && !item.fileKey) {
        throw new BadRequestException(`${requirement.label} needs an uploaded file (fileKey)`);
      }
      if (requirement.kind === TripRequirementKind.FIELD && !item.value?.trim()) {
        throw new BadRequestException(`${requirement.label} needs a value`);
      }
      return { requirement, item };
    });

    await this.prisma.$transaction(async (tx) => {
      for (const { requirement, item } of resolved) {
        await tx.tripRequirementFulfillment.upsert({
          where: {
            tripId_requirementId: { tripId: trip.id, requirementId: requirement.id },
          },
          update: {
            value: item.value?.trim() ?? null,
            fileKey: item.fileKey ?? null,
            source: params.source,
            fulfilledByUserId: params.userId,
            fulfilledAt: new Date(),
          },
          create: {
            tripId: trip.id,
            requirementId: requirement.id,
            value: item.value?.trim() ?? null,
            fileKey: item.fileKey ?? null,
            source: params.source,
            fulfilledByUserId: params.userId,
          },
        });

        // Documents also land in the trip document set so POD review / payout packs see them.
        if (requirement.kind === TripRequirementKind.DOCUMENT && item.fileKey) {
          await tx.tripDocument.create({
            data: {
              tripId: trip.id,
              docType: requirement.docType ?? DocumentType.OTHER,
              fileKey: item.fileKey,
              uploadedByUserId: params.userId,
            },
          });
          if (requirement.docType === DocumentType.POD_RUNSHEET) {
            await tx.trip.update({
              where: { id: trip.id },
              data: { podStatus: PODStatus.POD_UPLOADED_PENDING_REVIEW },
            });
          }
        }
      }

      await tx.trip.update({
        where: { id: trip.id },
        data: { lastDriverEventAt: new Date() },
      });
    });

    await this.audit.log({
      tenantId: params.tenantId,
      userId: params.userId,
      action: 'UPDATE',
      entityType: 'TRIP_REQUIREMENT_FULFILL',
      entityId: trip.id,
      changesJson: {
        source: params.source,
        codes: resolved.map((r) => r.requirement.code),
      },
    });

    return this.getStatus({
      tenantId: params.tenantId,
      tripId: params.tripId,
      driverId: params.driverId,
    });
  }

  /** Complete a trip only when every active required item is satisfied. No bypass. */
  async complete(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    source: Exclude<TripCompletionSource, 'ADMIN_FORCE'>;
    driverId?: string | null;
  }) {
    const trip = await this.loadTrip(params);
    this.assertTripOpen(trip);
    if (params.source === TripCompletionSource.DRIVER) {
      this.assertDriverAccepted(trip);
    }

    const items = await this.buildChecklist(trip);
    const missing = items.filter((i) => i.required && !i.fulfilled);
    if (missing.length > 0) {
      throw new BadRequestException({
        message: `Trip cannot be completed: ${missing.length} requirement(s) missing for this client`,
        missing: missing.map((m) => ({ code: m.code, label: m.label, kind: m.kind })),
      });
    }

    return this.markCompleted({
      trip,
      userId: params.userId,
      tenantId: params.tenantId,
      source: params.source,
    });
  }

  /** Admin-only override: close the trip regardless of missing requirements. */
  async forceComplete(params: {
    userId: string;
    tenantId: string;
    tripId: string;
    reason: string;
  }) {
    if (!params.reason?.trim()) {
      throw new BadRequestException('A reason is required to force complete a trip');
    }

    const trip = await this.loadTrip(params);
    this.assertTripOpen(trip);

    const items = await this.buildChecklist(trip);
    const bypassed = items.filter((i) => i.required && !i.fulfilled);

    return this.markCompleted({
      trip,
      userId: params.userId,
      tenantId: params.tenantId,
      source: TripCompletionSource.ADMIN_FORCE,
      reason: params.reason.trim(),
      bypassedCodes: bypassed.map((b) => b.code),
    });
  }

  private async markCompleted(params: {
    trip: TripForRequirements;
    userId: string;
    tenantId: string;
    source: TripCompletionSource;
    reason?: string;
    bypassedCodes?: string[];
  }) {
    const completedAt = new Date();
    const updated = await this.prisma.trip.update({
      where: { id: params.trip.id },
      data: {
        highLevelTripStatus: HighLevelTripStatus.COMPLETED,
        completedAt,
        completedByUserId: params.userId,
        completionSource: params.source,
        forceCompletedReason: params.reason ?? null,
      },
      include: {
        serviceCategory: { select: { id: true, code: true, name: true } },
        requirementFulfillments: { include: { requirement: true } },
      },
    });

    await this.audit.log({
      tenantId: params.tenantId,
      userId: params.userId,
      action: 'UPDATE',
      entityType:
        params.source === TripCompletionSource.ADMIN_FORCE
          ? 'TRIP_FORCE_COMPLETE'
          : 'TRIP_COMPLETE',
      entityId: params.trip.id,
      changesJson: {
        source: params.source,
        completedAt: completedAt.toISOString(),
        ...(params.reason ? { reason: params.reason } : {}),
        ...(params.bypassedCodes?.length ? { bypassedRequirements: params.bypassedCodes } : {}),
      },
    });

    return updated;
  }

  private async buildChecklist(trip: TripForRequirements) {
    const [requirements, fulfillments] = await Promise.all([
      this.loadRequirements(trip),
      this.prisma.tripRequirementFulfillment.findMany({ where: { tripId: trip.id } }),
    ]);
    const byRequirementId = new Map(fulfillments.map((f) => [f.requirementId, f]));

    return requirements.map((r) => {
      const f = byRequirementId.get(r.id);
      const fulfilled =
        r.kind === TripRequirementKind.DOCUMENT ? !!f?.fileKey : !!f?.value?.trim();
      return {
        id: r.id,
        code: r.code,
        label: r.label,
        kind: r.kind,
        docType: r.docType,
        required: r.required,
        helpText: r.helpText,
        fulfilled,
        value: f?.value ?? null,
        fileKey: f?.fileKey ?? null,
        fulfilledAt: f?.fulfilledAt ?? null,
        fulfilledBy: f?.fulfilledByUserId ?? null,
        source: f?.source ?? null,
      };
    });
  }

  private loadRequirements(trip: TripForRequirements) {
    return this.prisma.clientTripRequirement.findMany({
      where: {
        tenantId: trip.tenantId,
        clientAccountId: trip.clientAccountId,
        status: 'ACTIVE',
        OR: [{ serviceCategoryId: null }, { serviceCategoryId: trip.serviceCategoryId }],
      },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  private async loadTrip(params: {
    tenantId: string;
    tripId: string;
    driverId?: string | null;
  }): Promise<TripForRequirements> {
    // A driverId scopes the lookup so drivers can only touch their own trips.
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: params.tripId,
        tenantId: params.tenantId,
        ...(params.driverId ? { assignedDriverId: params.driverId } : {}),
      },
      include: { serviceCategory: { select: { id: true, code: true } } },
    });
    if (!trip) throw new NotFoundException('Trip not found');
    return trip;
  }

  private assertTripOpen(trip: TripForRequirements) {
    if (trip.highLevelTripStatus === HighLevelTripStatus.COMPLETED) {
      throw new BadRequestException('Trip is already completed');
    }
    if (trip.highLevelTripStatus === HighLevelTripStatus.CANCELLED) {
      throw new BadRequestException('Trip is cancelled');
    }
  }

  private assertDriverAccepted(trip: TripForRequirements) {
    if (trip.assignmentStatus !== AssignmentStatus.ACCEPTED) {
      throw new ForbiddenException('Trip must be accepted before submitting trip requirements');
    }
  }
}
