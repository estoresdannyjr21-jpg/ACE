import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RatesService } from '../rates/rates.service';
import { PayslipService } from './payslip.service';
import {
  BillingStatus,
  OverrideRequestStatus,
  PODStatus,
  PayoutBatchStatus,
  PayoutStatus,
  InvoiceType,
  CashbondLedgerType,
  ReimbursableStatus,
} from '@prisma/client';
import { Prisma } from '@prisma/client';

/** Blueprint §10.3: Wetlease tier override (PHP). trip_order 1 = 1st trip. */
const WETLEASE_TIERS: Record<string, { first: number; rest: number }> = {
  SPX_FM_4WCV_WETLEASE: { first: 2550, rest: 1840 },
  SPX_FM_6WCV_WETLEASE: { first: 3600, rest: 2520 },
};
const VAT_RATE = 1.12;
const ADMIN_FEE_PCT = 0.02;
const WITHHOLDING_PCT = 0.02;
const CASHBOND_DEDUCTION = 500;
const CASHBOND_CAP = 50000;
const SUBCONTRACTOR_INVOICE_DEADLINE_DAYS = 30;

/** Blueprint §12: Add N business days to a date; when excludeWeekends is true, skip Sat/Sun. */
function addBusinessDays(baseDate: Date, n: number, excludeWeekends: boolean): Date {
  const d = new Date(baseDate);
  let added = 0;
  while (added < n) {
    d.setDate(d.getDate() + 1);
    if (!excludeWeekends) {
      added++;
    } else {
      const day = d.getDay();
      if (day !== 0 && day !== 6) added++;
    }
  }
  return d;
}

/** Wednesday of the week (Mon–Sun) containing the given date. Submission is Mon/Tue; counting starts this Wednesday. */
function getCycleStartWednesday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun, 1 Mon, ..., 6 Sat
  const daysFromMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(d);
  monday.setDate(d.getDate() - daysFromMonday);
  const wednesday = new Date(monday);
  wednesday.setDate(monday.getDate() + 2);
  return wednesday;
}

/** Convert Prisma Decimal to number for API responses. */
function toNum(d: unknown): number {
  if (d == null) return 0;
  if (typeof d === 'number') return d;
  if (typeof d === 'object' && d !== null && 'toNumber' in d)
    return (d as { toNumber(): number }).toNumber();
  return Number(d);
}

/** Aging bucket key by days overdue (based on reference date). */
function getAgingBucket(referenceDate: Date | null, asOf: Date): string {
  if (!referenceDate) return 'no_date';
  const ref = new Date(referenceDate);
  const days = Math.floor((asOf.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000));
  if (days <= 30) return '0-30';
  if (days <= 60) return '31-60';
  if (days <= 90) return '61-90';
  return '90+';
}

@Injectable()
export class FinanceService {
  constructor(
    private prisma: PrismaService,
    private ratesService: RatesService,
    private audit: AuditService,
    private payslipService: PayslipService,
  ) {}

  async getFinanceLookups(tenantId: string) {
    const [clients, operators] = await Promise.all([
      this.prisma.clientAccount.findMany({
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
      }),
      this.prisma.operator.findMany({
        where: { tenantId, status: 'ACTIVE' },
        select: { id: true, name: true },
        orderBy: { name: 'asc' },
      }),
    ]);
    return { clients, operators };
  }

  async getTripByInternalRef(tenantId: string, internalRef: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        tenantId,
        internalRef,
      },
      include: {
        assignedDriver: true,
        assignedVehicle: true,
        serviceCategory: true,
        clientAccount: true,
        documents: {
          where: {
            docType: 'POD_RUNSHEET',
          },
        },
        finance: true,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.podStatus !== PODStatus.POD_VERIFIED) {
      throw new ForbiddenException('POD must be verified before Finance can process this trip');
    }

    return trip;
  }

  async markFinanceDocReceived(userId: string, tenantId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        tenantId,
      },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.podStatus !== PODStatus.POD_VERIFIED) {
      throw new ForbiddenException('POD must be verified before marking Finance Doc Received');
    }

    const docReceivedAt = new Date();
    let payoutDueDate: Date | undefined;

    const config = await this.prisma.clientServiceConfig.findFirst({
      where: {
        clientAccountId: trip.clientAccountId,
        serviceCategoryId: trip.serviceCategoryId,
      },
    });
    if (config) {
      const cycleStartWed = getCycleStartWednesday(docReceivedAt);
      payoutDueDate = addBusinessDays(
        cycleStartWed,
        config.payoutTermsBusinessDays,
        config.excludeWeekends,
      );
    }

    const finance = await this.prisma.tripFinance.upsert({
      where: { tripId },
      update: {
        financeDocReceivedAt: docReceivedAt,
        ...(payoutDueDate && { payoutDueDate }),
      },
      create: {
        tripId,
        financeDocReceivedAt: docReceivedAt,
        ...(payoutDueDate && { payoutDueDate }),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'FINANCE_DOC_RECEIVED',
      entityId: tripId,
      changesJson: { financeDocReceivedAt: docReceivedAt.toISOString(), payoutDueDate: payoutDueDate?.toISOString() },
    });

    return finance;
  }

  /**
   * Compute trip finance per blueprint §11.3:
   * Vatable Base = rate or wetlease tier; Non-Vat = Vatable/1.12;
   * Admin Fee = 2% of Vatable Base; payout_base by operator invoice type;
   * net_trip_payout_before_reimb = payout_base − admin_fee.
   */
  async computeTripFinance(tenantId: string, tripId: string, userId?: string) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
      include: {
        operatorAtAssignment: true,
        serviceCategory: true,
      },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.podStatus !== PODStatus.POD_VERIFIED) {
      throw new ForbiddenException('POD must be verified before computing finance');
    }

    const rate = await this.ratesService.getActiveRateForTrip(
      tenantId,
      trip.clientAccountId,
      trip.serviceCategoryId,
      trip.originArea,
      trip.destinationArea,
      trip.runsheetDate,
    );
    if (!rate) {
      throw new BadRequestException(
        'No route rate found for this trip (origin/destination/service/date). Add a rate first.',
      );
    }

    // Vatable Base Rate: from directory or wetlease tier (§10.3)
    let vatableBase = Number(rate.tripPayoutRateVatable);
    const tier = trip.serviceCategory?.code && WETLEASE_TIERS[trip.serviceCategory.code];
    if (tier) {
      const isFirst = trip.tripOrder === 1;
      vatableBase = isFirst ? tier.first : tier.rest;
    }

    const nonVatBase = vatableBase / VAT_RATE;
    const adminFeeAmount = vatableBase * ADMIN_FEE_PCT;

    const invoiceType: InvoiceType =
      trip.operatorAtAssignment?.invoiceType ?? InvoiceType.VATABLE;
    let payoutBase: number;
    switch (invoiceType) {
      case InvoiceType.VATABLE:
        payoutBase = vatableBase;
        break;
      case InvoiceType.NON_VATABLE:
        payoutBase = nonVatBase;
        break;
      case InvoiceType.NO_OR:
        payoutBase =
          vatableBase -
          nonVatBase * 0.12 -
          nonVatBase * WITHHOLDING_PCT;
        break;
      default:
        payoutBase = vatableBase;
    }

    const netTripPayoutBeforeReimb = Math.max(0, payoutBase - adminFeeAmount);

    const finance = await this.prisma.tripFinance.upsert({
      where: { tripId },
      update: {
        vatableBaseRate: new Prisma.Decimal(vatableBase),
        nonVatBaseRate: new Prisma.Decimal(nonVatBase),
        payoutBase: new Prisma.Decimal(payoutBase),
        adminFee: new Prisma.Decimal(adminFeeAmount),
        netTripPayoutBeforeReimb: new Prisma.Decimal(netTripPayoutBeforeReimb),
      },
      create: {
        tripId,
        vatableBaseRate: new Prisma.Decimal(vatableBase),
        nonVatBaseRate: new Prisma.Decimal(nonVatBase),
        payoutBase: new Prisma.Decimal(payoutBase),
        adminFee: new Prisma.Decimal(adminFeeAmount),
        netTripPayoutBeforeReimb: new Prisma.Decimal(netTripPayoutBeforeReimb),
      },
    });

    if (userId) {
      await this.audit.log({
        tenantId,
        userId,
        action: 'UPDATE',
        entityType: 'FINANCE_COMPUTE',
        entityId: tripId,
        changesJson: { vatableBaseRate: vatableBase, payoutBase, adminFeeAmount, netTripPayoutBeforeReimb },
      });
    }
    return finance;
  }

  /**
   * Get trips eligible for a batch with the given target release date.
   * Eligible = doc received, payout status READY_FOR_PAYOUT, payoutDueDate (target release) on the same calendar day, 30-day/override pass.
   */
  async getEligibleTripsForRelease(
    tenantId: string,
    params: { targetReleaseDate: string; operatorId: string; clientAccountId: string },
  ) {
    const targetDate = new Date(params.targetReleaseDate);
    const targetStart = new Date(targetDate);
    targetStart.setHours(0, 0, 0, 0);
    const targetEnd = new Date(targetDate);
    targetEnd.setHours(23, 59, 59, 999);

    const candidates = await this.prisma.trip.findMany({
      where: {
        tenantId,
        clientAccountId: params.clientAccountId,
        operatorIdAtAssignment: params.operatorId,
        podStatus: PODStatus.POD_VERIFIED,
        finance: {
          financeDocReceivedAt: { not: null },
          payoutStatus: PayoutStatus.READY_FOR_PAYOUT,
          payoutDueDate: { gte: targetStart, lte: targetEnd },
        },
      },
      include: {
        finance: true,
        overrideRequest: true,
        serviceCategory: { select: { code: true, name: true } },
      },
    });

    const now = new Date();
    const eligible = candidates.filter((trip) => {
      const baseDate = trip.requestDeliveryDate ?? trip.runsheetDate;
      const deadline = new Date(baseDate);
      deadline.setDate(deadline.getDate() + SUBCONTRACTOR_INVOICE_DEADLINE_DAYS);
      if (now <= deadline) return true;
      return (
        trip.finance?.overrideExpiredDeadline === true &&
        trip.overrideRequest?.status === 'APPROVED'
      );
    });

    for (const trip of eligible) {
      if (!trip.finance?.payoutBase) {
        await this.computeTripFinance(tenantId, trip.id);
      }
    }

    return this.prisma.trip.findMany({
      where: { id: { in: eligible.map((t) => t.id) } },
      include: {
        finance: true,
        serviceCategory: { select: { code: true, name: true } },
        assignedDriver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /**
   * Create a payout batch for a target release date. Only trips eligible for that release date can be included.
   * Eligible trips not included must have a reason (exclusions).
   */
  async createPayoutBatch(
    tenantId: string,
    dto: {
      operatorId: string;
      clientAccountId: string;
      targetReleaseDate: string;
      includedTripIds: string[];
      exclusions: { tripId: string; reason: string }[];
    },
  ) {
    const targetReleaseDate = new Date(dto.targetReleaseDate);

    const operator = await this.prisma.operator.findFirst({
      where: { id: dto.operatorId, tenantId },
    });
    if (!operator) {
      throw new NotFoundException('Operator not found');
    }

    const client = await this.prisma.clientAccount.findFirst({
      where: { id: dto.clientAccountId, tenantId },
    });
    if (!client) {
      throw new NotFoundException('Client account not found');
    }

    const eligible = await this.getEligibleTripsForRelease(tenantId, {
      targetReleaseDate: dto.targetReleaseDate,
      operatorId: dto.operatorId,
      clientAccountId: dto.clientAccountId,
    });
    const eligibleIds = new Set(eligible.map((t) => t.id));

    const includedSet = new Set(dto.includedTripIds);
    const exclusionMap = new Map(dto.exclusions.map((e) => [e.tripId, e.reason]));

    for (const id of includedSet) {
      if (!eligibleIds.has(id)) {
        throw new BadRequestException(`Trip ${id} is not eligible for release on ${dto.targetReleaseDate}`);
      }
    }
    const excludedIds = new Set(exclusionMap.keys());
    for (const id of excludedIds) {
      if (!eligibleIds.has(id)) {
        throw new BadRequestException(`Trip ${id} is not eligible for this release date`);
      }
      if (!exclusionMap.get(id)?.trim()) {
        throw new BadRequestException(`Exclusion reason is required for trip ${id}`);
      }
      if (includedSet.has(id)) {
        throw new BadRequestException(`Trip ${id} cannot be both included and excluded`);
      }
    }
    const includedOrExcluded = new Set([...includedSet, ...excludedIds]);
    const missing = [...eligibleIds].filter((id) => !includedOrExcluded.has(id));
    if (missing.length) {
      throw new BadRequestException(
        `Every eligible trip must be either included or excluded with a reason. Missing: ${missing.join(', ')}`,
      );
    }

    const includedTrips = eligible.filter((t) => includedSet.has(t.id));
    if (includedTrips.length === 0) {
      throw new BadRequestException('Batch must include at least one trip, or do not create a batch');
    }

    const runsheetDates = includedTrips.map((t) => t.runsheetDate.getTime());
    const periodStart = new Date(Math.min(...runsheetDates));
    const periodEnd = new Date(Math.max(...runsheetDates));

    let totalTripPayout = new Prisma.Decimal(0);
    let totalAdminFee = new Prisma.Decimal(0);
    let totalReimbursables = new Prisma.Decimal(0);

    const batch = await this.prisma.payoutBatch.create({
      data: {
        tenantId,
        operatorId: dto.operatorId,
        clientAccountId: dto.clientAccountId,
        periodStart,
        periodEnd,
        targetReleaseDate,
        status: PayoutBatchStatus.DRAFT,
        totalTripPayout,
        totalAdminFee,
        totalReimbursables,
      },
    });

    for (const trip of includedTrips) {
      const fin = trip.finance!;
      const payout = fin.netTripPayoutBeforeReimb ?? fin.payoutBase ?? new Prisma.Decimal(0);
      const admin = fin.adminFee ?? new Prisma.Decimal(0);
      const reimb = fin.approvedReimbursableAmount ?? new Prisma.Decimal(0);

      totalTripPayout = totalTripPayout.add(payout);
      totalAdminFee = totalAdminFee.add(admin);
      totalReimbursables = totalReimbursables.add(reimb);

      await this.prisma.payoutBatchTrip.create({
        data: {
          payoutBatchId: batch.id,
          tripId: trip.id,
          snapshotTripPayout: payout,
          snapshotAdminFee: admin,
          snapshotReimbursables: reimb,
        },
      });

      await this.prisma.tripFinance.update({
        where: { tripId: trip.id },
        data: {
          payoutStatus: PayoutStatus.IN_BATCH,
          payoutLedgerDate: new Date(),
        },
      });
    }

    for (const { tripId, reason } of dto.exclusions) {
      await this.prisma.payoutBatchExclusion.create({
        data: { payoutBatchId: batch.id, tripId, reason: reason.trim() },
      });
    }

    // Blueprint §14: Cashbond ₱500 per driver per batch, cap ₱50,000
    const driverTripPayouts = new Map<string, Prisma.Decimal>();
    for (const trip of includedTrips) {
      if (!trip.assignedDriverId) continue;
      const payout = trip.finance!.netTripPayoutBeforeReimb ?? trip.finance!.payoutBase ?? new Prisma.Decimal(0);
      const current = driverTripPayouts.get(trip.assignedDriverId) ?? new Prisma.Decimal(0);
      driverTripPayouts.set(trip.assignedDriverId, current.add(payout));
    }

    let totalCashbondDeduction = new Prisma.Decimal(0);
    for (const [driverId, tripPayoutSum] of driverTripPayouts) {
      if (tripPayoutSum.lte(0)) continue;
      let account = await this.prisma.driverCashbondAccount.findUnique({
        where: { driverId },
      });
      if (!account) {
        account = await this.prisma.driverCashbondAccount.create({
          data: {
            driverId,
            currentBalance: 0,
            capAmount: CASHBOND_CAP,
          },
        });
      }
      const cap = Number(account.capAmount);
      const balance = Number(account.currentBalance);
      if (balance >= cap) continue;
      const deduct = Math.min(CASHBOND_DEDUCTION, cap - balance);
      if (deduct <= 0) continue;

      await this.prisma.driverCashbondLedger.create({
        data: {
          driverId,
          payoutBatchId: batch.id,
          amount: new Prisma.Decimal(deduct),
          type: CashbondLedgerType.DEDUCTION,
        },
      });
      await this.prisma.driverCashbondAccount.update({
        where: { driverId },
        data: {
          currentBalance: new Prisma.Decimal(balance + deduct),
        },
      });
      totalCashbondDeduction = totalCashbondDeduction.add(deduct);
    }

    const netPayable = totalTripPayout.add(totalReimbursables).sub(totalCashbondDeduction);
    await this.prisma.payoutBatch.update({
      where: { id: batch.id },
      data: {
        totalTripPayout,
        totalAdminFee,
        totalReimbursables,
        totalCashbondDeduction,
        netPayable,
      },
    });

    return this.getPayoutBatch(tenantId, batch.id);
  }

  async getPayoutBatches(
    tenantId: string,
    query: { operatorId?: string; clientAccountId?: string; status?: string; targetReleaseDate?: string },
  ) {
    let targetReleaseFilter: Prisma.PayoutBatchWhereInput | undefined;
    if (query.targetReleaseDate) {
      const d = new Date(query.targetReleaseDate);
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(d);
      end.setHours(23, 59, 59, 999);
      targetReleaseFilter = { targetReleaseDate: { gte: start, lte: end } };
    }
    const where: Prisma.PayoutBatchWhereInput = {
      tenantId,
      ...(query.operatorId && { operatorId: query.operatorId }),
      ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
      ...(query.status && { status: query.status as PayoutBatchStatus }),
      ...targetReleaseFilter,
    };
    return this.prisma.payoutBatch.findMany({
      where,
      include: {
        operator: { select: { id: true, name: true } },
        clientAccount: { select: { id: true, name: true, code: true } },
        _count: { select: { trips: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPayoutBatch(tenantId: string, batchId: string) {
    const batch = await this.prisma.payoutBatch.findFirst({
      where: { id: batchId, tenantId },
      include: {
        operator: { select: { id: true, name: true } },
        clientAccount: { select: { id: true, name: true, code: true } },
        trips: {
          include: {
            trip: {
              select: {
                id: true,
                internalRef: true,
                runsheetDate: true,
                originArea: true,
                destinationArea: true,
              },
            },
          },
        },
        exclusions: {
          include: {
            trip: { select: { id: true, internalRef: true, runsheetDate: true } },
          },
        },
      },
    });
    if (!batch) {
      throw new NotFoundException('Payout batch not found');
    }
    return batch;
  }

  async setBatchHeld(tenantId: string, batchId: string, held: boolean) {
    const batch = await this.prisma.payoutBatch.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) {
      throw new NotFoundException('Payout batch not found');
    }
    if (batch.status !== PayoutBatchStatus.CFO_APPROVED) {
      throw new BadRequestException('Only CFO-approved batches can be held or released');
    }
    return this.prisma.payoutBatch.update({
      where: { id: batchId },
      data: {
        held,
        ...(held === false ? { releasedAt: new Date() } : {}),
      },
    });
  }

  async approvePayoutBatchByFinMgr(tenantId: string, batchId: string, userId: string) {
    const batch = await this.prisma.payoutBatch.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) {
      throw new NotFoundException('Payout batch not found');
    }
    if (batch.status !== PayoutBatchStatus.DRAFT) {
      throw new BadRequestException('Batch is not in DRAFT status');
    }
    const tripIds = await this.prisma.payoutBatchTrip.findMany({
      where: { payoutBatchId: batchId },
      select: { tripId: true },
    });

    await this.prisma.$transaction([
      this.prisma.tripFinance.updateMany({
        where: { tripId: { in: tripIds.map((t) => t.tripId) } },
        data: { payoutStatus: PayoutStatus.FIN_MGR_APPROVED },
      }),
      this.prisma.payoutBatch.update({
        where: { id: batchId },
        data: {
          status: PayoutBatchStatus.FIN_MGR_APPROVED,
          finMgrApprovedAt: new Date(),
          finMgrApprovedByUserId: userId,
        },
      }),
    ]);

    return this.getPayoutBatch(tenantId, batchId);
  }

  async approvePayoutBatchByCfo(tenantId: string, batchId: string, userId: string) {
    const batch = await this.prisma.payoutBatch.findFirst({
      where: { id: batchId, tenantId },
    });
    if (!batch) {
      throw new NotFoundException('Payout batch not found');
    }
    if (batch.status !== PayoutBatchStatus.FIN_MGR_APPROVED) {
      throw new BadRequestException('Batch must be approved by Finance Manager first');
    }
    const tripIds = await this.prisma.payoutBatchTrip.findMany({
      where: { payoutBatchId: batchId },
      select: { tripId: true },
    });

    const payslipFileKey = `payslips/${batchId}.pdf`;
    await this.prisma.$transaction([
      this.prisma.tripFinance.updateMany({
        where: { tripId: { in: tripIds.map((t) => t.tripId) } },
        data: { payoutStatus: PayoutStatus.CFO_APPROVED },
      }),
      this.prisma.payoutBatch.update({
        where: { id: batchId },
        data: {
          status: PayoutBatchStatus.CFO_APPROVED,
          cfoApprovedAt: new Date(),
          cfoApprovedByUserId: userId,
          payslipFileKey,
        },
      }),
    ]);

    const batchForPayslip = await this.getPayoutBatch(tenantId, batchId);
    try {
      await this.payslipService.generateAndSave(batchForPayslip as any);
    } catch {
      // Non-blocking; payslipFileKey is set, PDF can be regenerated later if needed
    }

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'PAYOUT_BATCH_CFO_APPROVE',
      entityId: batchId,
      changesJson: { payslipFileKey },
    });

    return this.getPayoutBatch(tenantId, batchId);
  }

  /** Blueprint §11.3: Encode reimbursables (toll/gas/parking) and set status (DRAFT → SUBMITTED_TO_CLIENT → APPROVED/REJECTED). */
  async updateReimbursables(
    tenantId: string,
    tripId: string,
    dto: {
      tollAmount?: number;
      gasAmount?: number;
      parkingAmount?: number;
      reimbursableStatus?: ReimbursableStatus;
    },
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
      include: { finance: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.podStatus !== PODStatus.POD_VERIFIED) {
      throw new ForbiddenException('POD must be verified');
    }
    const existing = trip.finance;
    if (!existing) {
      throw new BadRequestException('Mark Finance Doc Received and compute trip finance first');
    }

    const currentStatus = existing.reimbursableStatus ?? ReimbursableStatus.DRAFT;
    const newStatus = dto.reimbursableStatus ?? currentStatus;

    // Enforce allowed transitions: DRAFT → SUBMITTED_TO_CLIENT → APPROVED | REJECTED
    const allowedNext: Record<string, string[]> = {
      [ReimbursableStatus.DRAFT]: [ReimbursableStatus.SUBMITTED_TO_CLIENT],
      [ReimbursableStatus.SUBMITTED_TO_CLIENT]: [ReimbursableStatus.APPROVED, ReimbursableStatus.REJECTED],
      [ReimbursableStatus.APPROVED]: [],
      [ReimbursableStatus.REJECTED]: [],
    };
    if (newStatus !== currentStatus) {
      const allowed = allowedNext[currentStatus] ?? [];
      if (!allowed.includes(newStatus)) {
        throw new BadRequestException(
          `Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`,
        );
      }
    }

    const toll = dto.tollAmount ?? Number(existing.tollAmount ?? 0);
    const gas = dto.gasAmount ?? Number(existing.gasAmount ?? 0);
    const parking = dto.parkingAmount ?? Number(existing.parkingAmount ?? 0);

    return this.prisma.tripFinance.update({
      where: { tripId },
      data: {
        ...(dto.tollAmount !== undefined && { tollAmount: new Prisma.Decimal(dto.tollAmount) }),
        ...(dto.gasAmount !== undefined && { gasAmount: new Prisma.Decimal(dto.gasAmount) }),
        ...(dto.parkingAmount !== undefined && { parkingAmount: new Prisma.Decimal(dto.parkingAmount) }),
        reimbursableStatus: newStatus,
        ...(newStatus === ReimbursableStatus.APPROVED && {
          approvedReimbursableAmount: new Prisma.Decimal(toll + gas + parking),
        }),
        ...(newStatus === ReimbursableStatus.REJECTED && {
          approvedReimbursableAmount: null,
        }),
      },
    });
  }

  /** Blueprint §13: Admin/Manager submits override request (e.g. expired 30-day deadline). */
  async submitOverrideRequest(
    userId: string,
    tenantId: string,
    tripId: string,
    reason: string,
  ) {
    const trip = await this.prisma.trip.findFirst({
      where: { id: tripId, tenantId },
      include: { finance: true },
    });
    if (!trip) {
      throw new NotFoundException('Trip not found');
    }
    if (trip.podStatus !== PODStatus.POD_VERIFIED) {
      throw new BadRequestException('Trip must be POD verified');
    }
    const existing = await this.prisma.payoutOverrideRequest.findUnique({
      where: { tripId },
    });
    if (existing) {
      throw new BadRequestException(
        existing.status === 'PENDING'
          ? 'An override request is already pending for this trip'
          : `Override request already ${existing.status.toLowerCase()}`,
      );
    }
    const request = await this.prisma.payoutOverrideRequest.create({
      data: {
        tripId,
        submittedByUserId: userId,
        reason,
      },
      include: {
        trip: { select: { id: true, internalRef: true } },
        submitter: { select: { id: true, firstName: true, lastName: true } },
      },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'PAYOUT_OVERRIDE_REQUEST',
      entityId: request.id,
      changesJson: { tripId, reason },
    });
    return request;
  }

  /** Blueprint §13: CFO approves override; trip becomes eligible for payout batching. */
  async approveOverrideRequest(tenantId: string, requestId: string, userId: string) {
    const request = await this.prisma.payoutOverrideRequest.findUnique({
      where: { id: requestId },
      include: { trip: { select: { id: true, tenantId: true } } },
    });
    if (!request || !request.trip || request.trip.tenantId !== tenantId) {
      throw new NotFoundException('Override request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }
    await this.prisma.$transaction([
      this.prisma.payoutOverrideRequest.update({
        where: { id: requestId },
        data: {
          status: 'APPROVED',
          approvedByUserId: userId,
          approvedAt: new Date(),
          rejectionReason: null,
        },
      }),
      this.prisma.tripFinance.upsert({
        where: { tripId: request.tripId },
        update: {
          overrideExpiredDeadline: true,
          overrideRequestId: requestId,
        },
        create: {
          tripId: request.tripId,
          overrideExpiredDeadline: true,
          overrideRequestId: requestId,
        },
      }),
    ]);
    return this.prisma.payoutOverrideRequest.findUnique({
      where: { id: requestId },
      include: {
        trip: { select: { id: true, internalRef: true } },
        approver: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  }

  /** Blueprint §13: CFO rejects override request. */
  async rejectOverrideRequest(
    tenantId: string,
    requestId: string,
    rejectionReason: string,
    userId: string,
  ) {
    const request = await this.prisma.payoutOverrideRequest.findUnique({
      where: { id: requestId },
      include: { trip: { select: { tenantId: true } } },
    });
    if (!request || !request.trip || request.trip.tenantId !== tenantId) {
      throw new NotFoundException('Override request not found');
    }
    if (request.status !== 'PENDING') {
      throw new BadRequestException('Request is not pending');
    }
    const updated = await this.prisma.payoutOverrideRequest.update({
      where: { id: requestId },
      data: {
        status: 'REJECTED',
        rejectionReason,
      },
      include: {
        trip: { select: { id: true, internalRef: true } },
      },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'PAYOUT_OVERRIDE_REJECT',
      entityId: requestId,
      changesJson: { rejectionReason },
    });
    return updated;
  }

  async getFinanceDashboard(
    tenantId: string,
    query: {
      clientAccountId?: string;
      serviceCategoryId?: string;
      operatorId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const tripWhere: any = { tenantId };
    if (query.clientAccountId) tripWhere.clientAccountId = query.clientAccountId;
    if (query.serviceCategoryId) tripWhere.serviceCategoryId = query.serviceCategoryId;
    if (query.operatorId) tripWhere.operatorIdAtAssignment = query.operatorId;
    if (query.dateFrom || query.dateTo) {
      tripWhere.runsheetDate = {};
      if (query.dateFrom) tripWhere.runsheetDate.gte = new Date(query.dateFrom);
      if (query.dateTo) tripWhere.runsheetDate.lte = new Date(query.dateTo);
    }

    const now = new Date();
    const sevenDaysFromNow = new Date(now);
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);

    const [
      podVerifiedNotReceived,
      docReceivedNotComputed,
      billingReadyToBill,
      billingBilled,
      billingPaid,
      payoutReadyForPayout,
      payoutInBatch,
      payoutFinMgrApproved,
      payoutCfoApproved,
      payoutReleased,
      payoutPaid,
      reimbursablesPendingApproval,
      reimbursablesApprovedPendingBatch,
      overridesPendingCfo,
      overridesPendingList,
    ] = await Promise.all([
      this.prisma.trip.count({
        where: {
          ...tripWhere,
          podStatus: PODStatus.POD_VERIFIED,
          OR: [
            { finance: null },
            { finance: { financeDocReceivedAt: null } },
          ],
        },
      }),
      this.prisma.trip.count({
        where: {
          ...tripWhere,
          finance: {
            financeDocReceivedAt: { not: null },
            payoutBase: null,
          },
        },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, billingStatus: BillingStatus.READY_TO_BILL },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, billingStatus: BillingStatus.BILLED },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, billingStatus: BillingStatus.PAID },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.READY_FOR_PAYOUT },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.IN_BATCH },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.FIN_MGR_APPROVED },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.CFO_APPROVED },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.RELEASED },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, payoutStatus: PayoutStatus.PAID },
      }),
      this.prisma.tripFinance.count({
        where: { trip: tripWhere, reimbursableStatus: ReimbursableStatus.SUBMITTED_TO_CLIENT },
      }),
      this.prisma.tripFinance.count({
        where: {
          trip: tripWhere,
          reimbursableStatus: ReimbursableStatus.APPROVED,
          payoutStatus: PayoutStatus.READY_FOR_PAYOUT,
        },
      }),
      this.prisma.payoutOverrideRequest.count({
        where: { status: OverrideRequestStatus.PENDING, trip: tripWhere },
      }),
      this.prisma.payoutOverrideRequest.findMany({
        where: { status: OverrideRequestStatus.PENDING, trip: tripWhere },
        include: { trip: { select: { id: true, internalRef: true, runsheetDate: true } } },
        take: 50,
      }),
    ]);

    const podVerifiedNotReceivedList = await this.prisma.trip.findMany({
      where: {
        ...tripWhere,
        podStatus: PODStatus.POD_VERIFIED,
        OR: [
          { finance: null },
          { finance: { financeDocReceivedAt: null } },
        ],
      },
      select: {
        id: true,
        internalRef: true,
        runsheetDate: true,
        podStatus: true,
        assignedDriver: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 50,
    });

    const docReceivedNotComputedList = await this.prisma.trip.findMany({
      where: {
        ...tripWhere,
        finance: {
          financeDocReceivedAt: { not: null },
          payoutBase: null,
        },
      },
      select: {
        id: true,
        internalRef: true,
        runsheetDate: true,
        finance: { select: { id: true, financeDocReceivedAt: true } },
        assignedDriver: { select: { id: true, firstName: true, lastName: true } },
      },
      take: 50,
    });

    const subconExpiringSoon = await this.prisma.trip.count({
      where: {
        ...tripWhere,
        podStatus: PODStatus.POD_VERIFIED,
      },
    });
    const tripsForDeadline = await this.prisma.trip.findMany({
      where: {
        ...tripWhere,
        podStatus: PODStatus.POD_VERIFIED,
      },
      select: {
        id: true,
        requestDeliveryDate: true,
        runsheetDate: true,
        overrideRequest: { select: { status: true } },
      },
      take: 500,
    });
    let expiringSoonCount = 0;
    let expiredBlockedCount = 0;
    for (const t of tripsForDeadline) {
      const base = t.requestDeliveryDate ?? t.runsheetDate;
      const deadline = new Date(base);
      deadline.setDate(deadline.getDate() + SUBCONTRACTOR_INVOICE_DEADLINE_DAYS);
      if (deadline >= now && deadline <= sevenDaysFromNow) expiringSoonCount++;
      if (deadline < now && t.overrideRequest?.status !== 'APPROVED') expiredBlockedCount++;
    }

    return {
      counts: {
        podVerifiedNotReceived,
        docReceivedNotComputed,
        billingReadyToBill,
        billingBilled,
        billingPaid,
        payoutReadyForPayout,
        payoutInBatch,
        payoutFinMgrApproved,
        payoutCfoApproved,
        payoutReleased,
        payoutPaid,
        reimbursablesPendingApproval,
        reimbursablesApprovedPendingBatch,
        subconExpiringSoon: expiringSoonCount,
        subconExpiredBlocked: expiredBlockedCount,
        overridesPendingCfo,
      },
      podVerifiedNotReceivedList,
      docReceivedNotComputedList,
      overridesPendingList,
    };
  }

  /** AR Ledger: trips with billing status READY_TO_BILL or BILLED (receivables from client). */
  async getArLedger(
    tenantId: string,
    query: {
      clientAccountId?: string;
      serviceCategoryId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const tripWhere: Prisma.TripWhereInput = { tenantId };
    if (query.clientAccountId) tripWhere.clientAccountId = query.clientAccountId;
    if (query.serviceCategoryId) tripWhere.serviceCategoryId = query.serviceCategoryId;
    if (query.dateFrom || query.dateTo) {
      tripWhere.runsheetDate = {};
      if (query.dateFrom) (tripWhere.runsheetDate as Prisma.DateTimeFilter).gte = new Date(query.dateFrom);
      if (query.dateTo) (tripWhere.runsheetDate as Prisma.DateTimeFilter).lte = new Date(query.dateTo);
    }
    const where: Prisma.TripFinanceWhereInput = {
      trip: tripWhere,
      billingStatus: { in: [BillingStatus.READY_TO_BILL, BillingStatus.BILLED] },
    };

    const limit = Math.min(Math.max(1, query.limit ?? 100), 500);
    const offset = Math.max(0, query.offset ?? 0);

    const [totalCount, rows] = await Promise.all([
      this.prisma.tripFinance.count({ where }),
      this.prisma.tripFinance.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              internalRef: true,
              runsheetDate: true,
              clientAccount: { select: { id: true, name: true } },
              serviceCategory: { select: { id: true, name: true, code: true } },
            },
          },
        },
        orderBy: [{ billingLedgerDate: 'asc' }, { trip: { runsheetDate: 'asc' } }],
        skip: offset,
        take: limit,
      }),
    ]);

    const asOf = new Date();
    const ledger = rows.map((r) => {
      const amount = toNum(r.vatableBaseRate);
      const refDate = r.billingLedgerDate ?? r.trip.runsheetDate ?? null;
      return {
        tripFinanceId: r.id,
        tripId: r.trip.id,
        internalRef: r.trip.internalRef,
        runsheetDate: r.trip.runsheetDate,
        clientAccountId: r.trip.clientAccount?.id,
        clientAccountName: r.trip.clientAccount?.name,
        serviceCategoryName: r.trip.serviceCategory?.name,
        billingStatus: r.billingStatus,
        billingLedgerDate: r.billingLedgerDate,
        amount,
        agingBucket: getAgingBucket(refDate, asOf),
      };
    });

    const aging = this.computeAgingSummary(ledger.map((l) => ({ bucket: l.agingBucket, amount: l.amount })));
    const totalReceivable = ledger.reduce((s, l) => s + l.amount, 0);
    return { ledger, aging, totalReceivable, totalCount };
  }

  /** AP Ledger: trips with payout status not PAID (payables to operators). */
  async getApLedger(
    tenantId: string,
    query: {
      operatorId?: string;
      clientAccountId?: string;
      serviceCategoryId?: string;
      dateFrom?: string;
      dateTo?: string;
      limit?: number;
      offset?: number;
    },
  ) {
    const tripWhere: Prisma.TripWhereInput = { tenantId };
    if (query.operatorId) tripWhere.operatorIdAtAssignment = query.operatorId;
    if (query.clientAccountId) tripWhere.clientAccountId = query.clientAccountId;
    if (query.serviceCategoryId) tripWhere.serviceCategoryId = query.serviceCategoryId;
    const where: Prisma.TripFinanceWhereInput = {
      trip: tripWhere,
      payoutStatus: { not: PayoutStatus.PAID },
    };
    if (query.dateFrom || query.dateTo) {
      where.payoutDueDate = {};
      if (query.dateFrom) (where.payoutDueDate as Prisma.DateTimeNullableFilter).gte = new Date(query.dateFrom);
      if (query.dateTo) (where.payoutDueDate as Prisma.DateTimeNullableFilter).lte = new Date(query.dateTo);
    }

    const limit = Math.min(Math.max(1, query.limit ?? 100), 500);
    const offset = Math.max(0, query.offset ?? 0);

    const [totalCount, rows] = await Promise.all([
      this.prisma.tripFinance.count({ where }),
      this.prisma.tripFinance.findMany({
        where,
        include: {
          trip: {
            select: {
              id: true,
              internalRef: true,
              runsheetDate: true,
              operatorIdAtAssignment: true,
              operatorAtAssignment: { select: { id: true, name: true } },
              clientAccount: { select: { id: true, name: true } },
              serviceCategory: { select: { id: true, name: true } },
            },
          },
        },
        orderBy: [{ payoutDueDate: 'asc' }, { trip: { runsheetDate: 'asc' } }],
        skip: offset,
        take: limit,
      }),
    ]);

    const asOf = new Date();
    const ledger = rows.map((r) => {
      const base = toNum(r.netTripPayoutBeforeReimb);
      const reimb = toNum(r.approvedReimbursableAmount);
      const amount = base + reimb;
      const refDate = r.payoutDueDate ?? null;
      return {
        tripFinanceId: r.id,
        tripId: r.trip.id,
        internalRef: r.trip.internalRef,
        runsheetDate: r.trip.runsheetDate,
        operatorId: r.trip.operatorAtAssignment?.id,
        operatorName: r.trip.operatorAtAssignment?.name,
        clientAccountName: r.trip.clientAccount?.name,
        serviceCategoryName: r.trip.serviceCategory?.name,
        payoutStatus: r.payoutStatus,
        payoutDueDate: r.payoutDueDate,
        amount,
        agingBucket: getAgingBucket(refDate, asOf),
      };
    });

    const aging = this.computeAgingSummary(ledger.map((l) => ({ bucket: l.agingBucket, amount: l.amount })));
    const totalPayable = ledger.reduce((s, l) => s + l.amount, 0);
    return { ledger, aging, totalPayable, totalCount };
  }

  private computeAgingSummary(
    items: { bucket: string; amount: number }[],
  ): { bucket: string; amount: number; count: number }[] {
    const map = new Map<string, { amount: number; count: number }>();
    const buckets = ['0-30', '31-60', '61-90', '90+', 'no_date'];
    buckets.forEach((b) => map.set(b, { amount: 0, count: 0 }));
    for (const { bucket, amount } of items) {
      const b = bucket || 'no_date';
      if (!map.has(b)) map.set(b, { amount: 0, count: 0 });
      const cur = map.get(b)!;
      cur.amount += amount;
      cur.count += 1;
    }
    return buckets.map((bucket) => ({
      bucket,
      amount: map.get(bucket)!.amount,
      count: map.get(bucket)!.count,
    }));
  }

  async getArBatches(
    tenantId: string,
    query: { clientAccountId?: string; serviceSegment?: string; status?: string; cutoffFrom?: string; cutoffTo?: string },
  ) {
    const where: Prisma.ArBatchWhereInput = { tenantId };
    if (query.clientAccountId) where.clientAccountId = query.clientAccountId;
    if (query.serviceSegment) where.serviceSegment = query.serviceSegment;
    if (query.status) where.status = query.status;
    if (query.cutoffFrom) where.cutoffStartDate = { gte: new Date(query.cutoffFrom) };
    if (query.cutoffTo) where.cutoffEndDate = { lte: new Date(query.cutoffTo) };
    const batches = await this.prisma.arBatch.findMany({
      where,
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        _count: { select: { trips: true, unmatchedLines: true } },
      },
      orderBy: [{ cutoffStartDate: 'desc' }, { cutoffEndDate: 'desc' }],
    });
    return batches;
  }

  async getArBatchById(tenantId: string, id: string) {
    const batch = await this.prisma.arBatch.findFirst({
      where: { id, tenantId },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        trips: {
          include: {
            trip: {
              select: {
                id: true,
                internalRef: true,
                clientTripRef: true,
                externalRef: true,
                runsheetDate: true,
                serviceCategory: { select: { id: true, code: true, name: true } },
                finance: true,
              },
            },
          },
        },
        unmatchedLines: true,
      },
    });
    if (!batch) throw new NotFoundException('AR batch not found');
    return batch;
  }

  async attachInvoiceToArBatch(
    tenantId: string,
    userId: string,
    batchId: string,
    dto: { invoiceNumber: string; invoiceDate: string },
  ) {
    const batch = await this.prisma.arBatch.findFirst({
      where: { id: batchId, tenantId },
      include: { trips: { select: { tripId: true } } },
    });
    if (!batch) throw new NotFoundException('AR batch not found');
    if (batch.status !== 'REVERSE_BILLING_RECEIVED') {
      throw new BadRequestException('Invoice can only be attached when batch status is REVERSE_BILLING_RECEIVED');
    }
    const invoiceDate = new Date(dto.invoiceDate);
    if (isNaN(invoiceDate.getTime())) throw new BadRequestException('Invalid invoiceDate');

    await this.prisma.$transaction(async (tx) => {
      await tx.arBatch.update({
        where: { id: batchId },
        data: {
          invoiceNumber: dto.invoiceNumber,
          invoiceDate: invoiceDate,
          status: 'INVOICED',
        },
      });
      const tripIds = batch.trips.map((t) => t.tripId);
      if (tripIds.length > 0) {
        await tx.tripFinance.updateMany({
          where: { tripId: { in: tripIds } },
          data: { billingStatus: BillingStatus.BILLED, billingLedgerDate: invoiceDate },
        });
      }
    });

    this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'AR_BATCH',
      entityId: batchId,
      changesJson: { invoiceNumber: dto.invoiceNumber, invoiceDate: dto.invoiceDate },
    }).catch(() => {});

    return this.getArBatchById(tenantId, batchId);
  }

  async markArBatchDeposited(tenantId: string, userId: string, batchId: string) {
    const batch = await this.prisma.arBatch.findFirst({
      where: { id: batchId, tenantId },
      include: { trips: { select: { tripId: true } } },
    });
    if (!batch) throw new NotFoundException('AR batch not found');
    if (batch.status !== 'PAYMENT_LIST_RECEIVED') {
      throw new BadRequestException('Batch must be in PAYMENT_LIST_RECEIVED status before marking deposited');
    }

    const depositedAt = new Date();
    await this.prisma.$transaction(async (tx) => {
      await tx.arBatch.update({
        where: { id: batchId },
        data: { depositedAt, status: 'DEPOSITED' },
      });
      const tripIds = batch.trips.map((t) => t.tripId);
      if (tripIds.length > 0) {
        await tx.tripFinance.updateMany({
          where: { tripId: { in: tripIds } },
          data: { billingStatus: BillingStatus.PAID },
        });
      }
    });

    this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'AR_BATCH',
      entityId: batchId,
      changesJson: { depositedAt: depositedAt.toISOString() },
    }).catch(() => {});

    return this.getArBatchById(tenantId, batchId);
  }

  /** Segment → service category codes for AR batching (same as rates). */
  private readonly SEGMENT_TO_CATEGORY_CODES: Record<string, string[]> = {
    FM_ONCALL: ['SPX_FM_4W_ONCALL', 'SPX_FM_6WCV_ONCALL', 'SPX_FM_10W_ONCALL'],
    FM_WETLEASE: ['SPX_FM_4WCV_WETLEASE', 'SPX_FM_6WCV_WETLEASE'],
    MFM_ONCALL: ['SPX_MEGA_FM_6W', 'SPX_MEGA_FM_10W', 'SPX_MFM_SHUNTING_6W'],
  };

  /**
   * Import client reverse billing CSV. Match by client_trip_ref first, then our_internal_ref.
   * Preview: validate and return counts; commit: create/update ArBatch, link trips, mark disputes, record unmatched.
   */
  async importReverseBillingCsv(params: {
    userId: string;
    tenantId: string;
    csvBuffer: Buffer;
    commit: boolean;
    clientCode: string;
    serviceSegment: 'FM_ONCALL' | 'FM_WETLEASE' | 'MFM_ONCALL';
    cutoffStartDate: string;
    cutoffEndDate: string;
  }) {
    const { userId, tenantId, csvBuffer, commit, clientCode, serviceSegment, cutoffStartDate, cutoffEndDate } = params;
    const allowedSegments = Object.keys(this.SEGMENT_TO_CATEGORY_CODES);
    if (!allowedSegments.includes(serviceSegment)) {
      throw new BadRequestException(`service_segment must be one of: ${allowedSegments.join(', ')}`);
    }
    const cutoffStart = new Date(cutoffStartDate);
    const cutoffEnd = new Date(cutoffEndDate);
    if (isNaN(cutoffStart.getTime()) || isNaN(cutoffEnd.getTime())) {
      throw new BadRequestException('cutoff_start_date and cutoff_end_date must be valid ISO dates');
    }
    if (cutoffEnd < cutoffStart) {
      throw new BadRequestException('cutoff_end_date must be on or after cutoff_start_date');
    }

    const client = await this.prisma.clientAccount.findFirst({
      where: { tenantId, code: clientCode, status: 'ACTIVE' },
    });
    if (!client) {
      throw new BadRequestException(`Client not found for code: ${clientCode}`);
    }

    const categoryCodes = this.SEGMENT_TO_CATEGORY_CODES[serviceSegment];
    const categories = await this.prisma.serviceCategory.findMany({
      where: { clientAccountId: client.id, code: { in: categoryCodes }, status: 'ACTIVE' },
    });
    const categoryIds = categories.map((c) => c.id);
    const codeToId = new Map(categories.map((c) => [c.code, c.id]));

    const lines = parseCsvLines(csvBuffer);
    if (lines.length < 2) {
      return { mode: commit ? 'commit' : 'preview', totalRows: 0, matched: 0, disputes: 0, unmatched: 0, errors: [], unmatchedLines: [] };
    }
    const header = lines[0].map((c) => (c || '').trim().toLowerCase());
    const clientTripRefIdx = header.indexOf('client_trip_ref');
    const ourInternalRefIdx = header.indexOf('our_internal_ref');
    const serviceCategoryCodeIdx = header.indexOf('service_category_code');
    const runsheetDateIdx = header.indexOf('runsheet_date');
    const amountClientIdx = header.indexOf('amount_client');

    if (clientTripRefIdx === -1) {
      throw new BadRequestException('CSV must have a header row with column: client_trip_ref');
    }

    const errors: string[] = [];
    const rows: { clientTripRef: string; ourInternalRef?: string; serviceCategoryCode?: string; runsheetDate?: string; amountClient?: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const clientTripRef = row[clientTripRefIdx]?.trim();
      if (!clientTripRef) {
        errors.push(`Row ${i + 1}: client_trip_ref is required`);
        continue;
      }
      rows.push({
        clientTripRef,
        ourInternalRef: ourInternalRefIdx >= 0 ? row[ourInternalRefIdx]?.trim() : undefined,
        serviceCategoryCode: serviceCategoryCodeIdx >= 0 ? row[serviceCategoryCodeIdx]?.trim() : undefined,
        runsheetDate: runsheetDateIdx >= 0 ? row[runsheetDateIdx]?.trim() : undefined,
        amountClient: amountClientIdx >= 0 ? row[amountClientIdx]?.trim() : undefined,
      });
    }

    const tripWhere: Prisma.TripWhereInput = {
      tenantId,
      clientAccountId: client.id,
      serviceCategoryId: { in: categoryIds },
      runsheetDate: { gte: cutoffStart, lte: cutoffEnd },
    };

    const allTripsInPeriod = await this.prisma.trip.findMany({
      where: tripWhere,
      select: { id: true, internalRef: true, clientTripRef: true, externalRef: true, serviceCategoryId: true, runsheetDate: true },
    });
    const byClientRef = new Map<string, typeof allTripsInPeriod>();
    const byInternalRef = new Map<string, (typeof allTripsInPeriod)[0]>();
    for (const t of allTripsInPeriod) {
      const ref = (t.clientTripRef || t.externalRef || '').trim();
      if (ref) {
        if (!byClientRef.has(ref)) byClientRef.set(ref, []);
        byClientRef.get(ref)!.push(t);
      }
      byInternalRef.set(t.internalRef, t);
    }

    const matchedTripIds = new Set<string>();
    const unmatchedLines: { clientTripRef: string; ourInternalRef?: string; serviceCategoryCode?: string; runsheetDate?: string; amountClient?: string }[] = [];

    for (const r of rows) {
      let trip: (typeof allTripsInPeriod)[0] | undefined;
      const byRef = byClientRef.get(r.clientTripRef.trim());
      if (byRef && byRef.length === 1) {
        trip = byRef[0];
      } else if (byRef && byRef.length > 1 && r.ourInternalRef) {
        trip = byRef.find((t) => t.internalRef === r.ourInternalRef) ?? byRef[0];
      } else if (r.ourInternalRef) {
        trip = byInternalRef.get(r.ourInternalRef.trim());
        if (trip && !categoryIds.includes(trip.serviceCategoryId)) trip = undefined;
      }
      if (trip) {
        matchedTripIds.add(trip.id);
      } else {
        unmatchedLines.push(r);
      }
    }

    const disputeTripIds = allTripsInPeriod.filter((t) => !matchedTripIds.has(t.id)).map((t) => t.id);

    if (!commit) {
      return {
        mode: 'preview',
        totalRows: rows.length,
        matched: matchedTripIds.size,
        disputes: disputeTripIds.length,
        unmatched: unmatchedLines.length,
        errors: errors.length ? errors : undefined,
        unmatchedLines: unmatchedLines.slice(0, 50),
      };
    }

    await this.prisma.$transaction(async (tx) => {
      const arBatch = await tx.arBatch.upsert({
        where: {
          tenantId_clientAccountId_serviceSegment_cutoffStartDate_cutoffEndDate: {
            tenantId,
            clientAccountId: client.id,
            serviceSegment,
            cutoffStartDate: cutoffStart,
            cutoffEndDate: cutoffEnd,
          },
        },
        create: {
          tenantId,
          clientAccountId: client.id,
          serviceSegment,
          cutoffStartDate: cutoffStart,
          cutoffEndDate: cutoffEnd,
          reverseBillingReceivedAt: new Date(),
          status: 'REVERSE_BILLING_RECEIVED',
        },
        update: {
          reverseBillingReceivedAt: new Date(),
          status: 'REVERSE_BILLING_RECEIVED',
        },
      });

      await tx.arBatchTrip.deleteMany({ where: { arBatchId: arBatch.id } });
      for (const tripId of matchedTripIds) {
        await tx.arBatchTrip.create({ data: { arBatchId: arBatch.id, tripId } });
      }

      for (const u of unmatchedLines) {
        await tx.arBatchUnmatchedLine.create({
          data: {
            arBatchId: arBatch.id,
            clientProvidedRef: u.clientTripRef,
            ourInternalRef: u.ourInternalRef ?? undefined,
            serviceCategoryCode: u.serviceCategoryCode ?? undefined,
            runsheetDate: u.runsheetDate ? new Date(u.runsheetDate) : undefined,
            amountClient: u.amountClient ? new Prisma.Decimal(u.amountClient) : undefined,
            uploadedByUserId: userId,
          },
        });
      }

      await tx.tripFinance.updateMany({
        where: { tripId: { in: Array.from(matchedTripIds) } },
        data: { billingDispute: false, billingDisputeReason: null },
      });
      await tx.tripFinance.updateMany({
        where: { tripId: { in: disputeTripIds } },
        data: {
          billingDispute: true,
          billingDisputeReason: 'Not in client reverse billing for this cut-off',
        },
      });
    });

    this.audit.log({
      tenantId,
      userId,
      action: 'IMPORT',
      entityType: 'AR_REVERSE_BILLING',
      entityId: '',
      changesJson: { clientCode, serviceSegment, cutoffStartDate, cutoffEndDate, matched: matchedTripIds.size, disputes: disputeTripIds.length, unmatched: unmatchedLines.length },
    }).catch(() => {});

    return {
      mode: 'commit',
      totalRows: rows.length,
      matched: matchedTripIds.size,
      disputes: disputeTripIds.length,
      unmatched: unmatchedLines.length,
      errors: errors.length ? errors : undefined,
    };
  }

  /**
   * Import payment list CSV. Updates ArBatch records with paymentListReceivedAt and optional amount.
   * CSV columns: invoice_number, amount_paid (optional).
   */
  async importPaymentListCsv(params: {
    userId: string;
    tenantId: string;
    csvBuffer: Buffer;
    commit: boolean;
    clientCode: string;
    paymentListReceivedDate: string;
  }) {
    const { userId, tenantId, csvBuffer, commit, clientCode, paymentListReceivedDate } = params;
    const receivedAt = new Date(paymentListReceivedDate);
    if (isNaN(receivedAt.getTime())) {
      throw new BadRequestException('payment_list_received_date must be a valid ISO date');
    }

    const client = await this.prisma.clientAccount.findFirst({
      where: { tenantId, code: clientCode, status: 'ACTIVE' },
    });
    if (!client) {
      throw new BadRequestException(`Client not found for code: ${clientCode}`);
    }

    const lines = parseCsvLines(csvBuffer);
    if (lines.length < 2) {
      return { mode: commit ? 'commit' : 'preview', totalRows: 0, updated: 0, errors: [], notFound: [] };
    }
    const header = lines[0].map((c) => (c || '').trim().toLowerCase());
    const invoiceNumberIdx = header.indexOf('invoice_number');
    const amountPaidIdx = header.indexOf('amount_paid');
    if (invoiceNumberIdx === -1) {
      throw new BadRequestException('CSV must have a header row with column: invoice_number');
    }

    const errors: string[] = [];
    const rows: { invoiceNumber: string; amountPaid?: string }[] = [];
    for (let i = 1; i < lines.length; i++) {
      const row = lines[i];
      const invoiceNumber = row[invoiceNumberIdx]?.trim();
      if (!invoiceNumber) {
        errors.push(`Row ${i + 1}: invoice_number is required`);
        continue;
      }
      rows.push({
        invoiceNumber,
        amountPaid: amountPaidIdx >= 0 ? row[amountPaidIdx]?.trim() : undefined,
      });
    }

    const batches = await this.prisma.arBatch.findMany({
      where: { tenantId, clientAccountId: client.id, invoiceNumber: { not: null } },
      select: { id: true, invoiceNumber: true },
    });
    const byInvoice = new Map<string | null, (typeof batches)[0]>();
    for (const b of batches) {
      if (b.invoiceNumber) byInvoice.set(b.invoiceNumber.trim(), b);
    }

    const toUpdate: { batchId: string; amountPaid?: string }[] = [];
    const notFound: string[] = [];
    for (const r of rows) {
      const batch = byInvoice.get(r.invoiceNumber);
      if (batch) toUpdate.push({ batchId: batch.id, amountPaid: r.amountPaid });
      else notFound.push(r.invoiceNumber);
    }

    if (!commit) {
      return {
        mode: 'preview',
        totalRows: rows.length,
        updated: toUpdate.length,
        notFound: notFound.slice(0, 50),
        errors: errors.length ? errors : undefined,
      };
    }

    const checkPickup = new Date(receivedAt);
    checkPickup.setDate(checkPickup.getDate() + 4);

    for (const u of toUpdate) {
      await this.prisma.arBatch.update({
        where: { id: u.batchId },
        data: {
          paymentListReceivedAt: receivedAt,
          checkPickupDate: checkPickup,
          amountPaidFromClient: u.amountPaid ? new Prisma.Decimal(u.amountPaid) : undefined,
          status: 'PAYMENT_LIST_RECEIVED',
        },
      });
    }

    this.audit.log({
      tenantId,
      userId,
      action: 'IMPORT',
      entityType: 'AR_PAYMENT_LIST',
      entityId: '',
      changesJson: { clientCode, paymentListReceivedDate, updated: toUpdate.length, notFound: notFound.length },
    }).catch(() => {});

    return {
      mode: 'commit',
      totalRows: rows.length,
      updated: toUpdate.length,
      notFound,
      errors: errors.length ? errors : undefined,
    };
  }
}

/** Parse CSV buffer into rows (array of string[]). Handles quoted fields. */
function parseCsvLines(buffer: Buffer): string[][] {
  const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines: string[][] = [];
  let current: string[] = [];
  let field = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (inQuotes) {
      field += c;
    } else if (c === ',' || c === '\n') {
      current.push(field.trim());
      field = '';
      if (c === '\n') {
        lines.push(current);
        current = [];
      }
    } else {
      field += c;
    }
  }
  if (field || current.length > 0) {
    current.push(field.trim());
    lines.push(current);
  }
  return lines;
}
