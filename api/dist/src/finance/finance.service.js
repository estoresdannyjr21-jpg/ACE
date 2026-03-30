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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const rates_service_1 = require("../rates/rates.service");
const payslip_service_1 = require("./payslip.service");
const client_1 = require("@prisma/client");
const client_2 = require("@prisma/client");
const VAT_RATE = 1.12;
const ADMIN_FEE_PCT = 0.02;
const WITHHOLDING_PCT = 0.02;
const CASHBOND_DEDUCTION = 500;
const CASHBOND_CAP = 50000;
const SUBCONTRACTOR_INVOICE_DEADLINE_DAYS = 30;
function addBusinessDays(baseDate, n, excludeWeekends) {
    const d = new Date(baseDate);
    let added = 0;
    while (added < n) {
        d.setDate(d.getDate() + 1);
        if (!excludeWeekends) {
            added++;
        }
        else {
            const day = d.getDay();
            if (day !== 0 && day !== 6)
                added++;
        }
    }
    return d;
}
function getCycleStartWednesday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const daysFromMonday = day === 0 ? 6 : day - 1;
    const monday = new Date(d);
    monday.setDate(d.getDate() - daysFromMonday);
    const wednesday = new Date(monday);
    wednesday.setDate(monday.getDate() + 2);
    return wednesday;
}
function toNum(d) {
    if (d == null)
        return 0;
    if (typeof d === 'number')
        return d;
    if (typeof d === 'object' && d !== null && 'toNumber' in d)
        return d.toNumber();
    return Number(d);
}
function getAgingBucket(referenceDate, asOf) {
    if (!referenceDate)
        return 'no_date';
    const ref = new Date(referenceDate);
    const days = Math.floor((asOf.getTime() - ref.getTime()) / (24 * 60 * 60 * 1000));
    if (days <= 30)
        return '0-30';
    if (days <= 60)
        return '31-60';
    if (days <= 90)
        return '61-90';
    return '90+';
}
let FinanceService = class FinanceService {
    constructor(prisma, ratesService, audit, payslipService) {
        this.prisma = prisma;
        this.ratesService = ratesService;
        this.audit = audit;
        this.payslipService = payslipService;
        this.SEGMENT_TO_CATEGORY_CODES = {
            FM_ONCALL: ['SPX_FM_4W_ONCALL', 'SPX_FM_6WCV_ONCALL', 'SPX_FM_10W_ONCALL'],
            FM_WETLEASE: ['SPX_FM_4WCV_WETLEASE', 'SPX_FM_6WCV_WETLEASE'],
            MFM_ONCALL: ['SPX_MEGA_FM_6W', 'SPX_MEGA_FM_10W', 'SPX_MFM_SHUNTING_6W'],
        };
    }
    async getFinanceLookups(tenantId) {
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
    async getTripByInternalRef(tenantId, internalRef) {
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
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_VERIFIED) {
            throw new common_1.ForbiddenException('POD must be verified before Finance can process this trip');
        }
        return trip;
    }
    async markFinanceDocReceived(userId, tenantId, tripId) {
        const trip = await this.prisma.trip.findFirst({
            where: {
                id: tripId,
                tenantId,
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_VERIFIED) {
            throw new common_1.ForbiddenException('POD must be verified before marking Finance Doc Received');
        }
        const docReceivedAt = new Date();
        let payoutDueDate;
        const config = await this.prisma.clientServiceConfig.findFirst({
            where: {
                clientAccountId: trip.clientAccountId,
                serviceCategoryId: trip.serviceCategoryId,
            },
        });
        if (config) {
            const cycleStartWed = getCycleStartWednesday(docReceivedAt);
            payoutDueDate = addBusinessDays(cycleStartWed, config.payoutTermsBusinessDays, config.excludeWeekends);
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
    async computeTripFinance(tenantId, tripId, userId) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
            include: {
                operatorAtAssignment: true,
                serviceCategory: true,
            },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_VERIFIED) {
            throw new common_1.ForbiddenException('POD must be verified before computing finance');
        }
        const rate = await this.ratesService.getActiveRateForTrip(tenantId, trip.clientAccountId, trip.serviceCategoryId, trip.originArea, trip.destinationArea, trip.runsheetDate);
        if (!rate) {
            throw new common_1.BadRequestException('No route rate found for this trip (origin/destination/service/date). Add a rate first.');
        }
        let subcontractorVatable = Number(rate.tripPayoutRateVatable);
        let clientBill = Number(rate.billRateAmount);
        const catCode = trip.serviceCategory?.code;
        if (this.ratesService.isWetleaseCategoryCode(catCode)) {
            if (!trip.assignedDriverId) {
                throw new common_1.BadRequestException('Wetlease finance requires an assigned driver. Same-day first trip is the earliest call time for that driver and category.');
            }
            const { dayStart, dayEnd } = (0, rates_service_1.utcCalendarDayBounds)(trip.runsheetDate);
            const firstSub = await this.ratesService.resolveWetleaseFirstTripPayoutAmount(tenantId, trip.clientAccountId, trip.serviceCategoryId, trip.runsheetDate);
            const firstClient = await this.ratesService.resolveWetleaseFirstTripClientBillAmount(tenantId, trip.clientAccountId, trip.serviceCategoryId, trip.runsheetDate);
            const sameDayTrips = await this.prisma.trip.findMany({
                where: {
                    tenantId,
                    clientAccountId: trip.clientAccountId,
                    serviceCategoryId: trip.serviceCategoryId,
                    assignedDriverId: trip.assignedDriverId,
                    runsheetDate: { gte: dayStart, lte: dayEnd },
                },
                select: { id: true, callTime: true },
                orderBy: [{ callTime: 'asc' }, { id: 'asc' }],
            });
            const idx = sameDayTrips.findIndex((t) => t.id === tripId);
            if (idx < 0) {
                throw new common_1.BadRequestException('Trip not found in same-day wetlease sequence (data inconsistency).');
            }
            const isFirst = idx === 0;
            subcontractorVatable = isFirst ? firstSub : 0;
            clientBill = isFirst ? firstClient : 0;
        }
        const vatableBase = subcontractorVatable;
        const nonVatBase = vatableBase / VAT_RATE;
        const adminFeeAmount = vatableBase * ADMIN_FEE_PCT;
        const invoiceType = trip.operatorAtAssignment?.invoiceType ?? client_1.InvoiceType.VATABLE;
        let payoutBase;
        switch (invoiceType) {
            case client_1.InvoiceType.VATABLE:
                payoutBase = vatableBase;
                break;
            case client_1.InvoiceType.NON_VATABLE:
                payoutBase = nonVatBase;
                break;
            case client_1.InvoiceType.NO_OR:
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
                clientBillAmount: new client_2.Prisma.Decimal(clientBill),
                vatableBaseRate: new client_2.Prisma.Decimal(vatableBase),
                nonVatBaseRate: new client_2.Prisma.Decimal(nonVatBase),
                payoutBase: new client_2.Prisma.Decimal(payoutBase),
                adminFee: new client_2.Prisma.Decimal(adminFeeAmount),
                netTripPayoutBeforeReimb: new client_2.Prisma.Decimal(netTripPayoutBeforeReimb),
            },
            create: {
                tripId,
                clientBillAmount: new client_2.Prisma.Decimal(clientBill),
                vatableBaseRate: new client_2.Prisma.Decimal(vatableBase),
                nonVatBaseRate: new client_2.Prisma.Decimal(nonVatBase),
                payoutBase: new client_2.Prisma.Decimal(payoutBase),
                adminFee: new client_2.Prisma.Decimal(adminFeeAmount),
                netTripPayoutBeforeReimb: new client_2.Prisma.Decimal(netTripPayoutBeforeReimb),
            },
        });
        if (userId) {
            await this.audit.log({
                tenantId,
                userId,
                action: 'UPDATE',
                entityType: 'FINANCE_COMPUTE',
                entityId: tripId,
                changesJson: {
                    clientBillAmount: clientBill,
                    vatableBaseRate: vatableBase,
                    payoutBase,
                    adminFeeAmount,
                    netTripPayoutBeforeReimb,
                },
            });
        }
        return finance;
    }
    async getEligibleTripsForRelease(tenantId, params) {
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
                podStatus: client_1.PODStatus.POD_VERIFIED,
                finance: {
                    financeDocReceivedAt: { not: null },
                    payoutStatus: client_1.PayoutStatus.READY_FOR_PAYOUT,
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
            if (now <= deadline)
                return true;
            return (trip.finance?.overrideExpiredDeadline === true &&
                trip.overrideRequest?.status === 'APPROVED');
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
    async createPayoutBatch(tenantId, dto) {
        const targetReleaseDate = new Date(dto.targetReleaseDate);
        const operator = await this.prisma.operator.findFirst({
            where: { id: dto.operatorId, tenantId },
        });
        if (!operator) {
            throw new common_1.NotFoundException('Operator not found');
        }
        const client = await this.prisma.clientAccount.findFirst({
            where: { id: dto.clientAccountId, tenantId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client account not found');
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
                throw new common_1.BadRequestException(`Trip ${id} is not eligible for release on ${dto.targetReleaseDate}`);
            }
        }
        const excludedIds = new Set(exclusionMap.keys());
        for (const id of excludedIds) {
            if (!eligibleIds.has(id)) {
                throw new common_1.BadRequestException(`Trip ${id} is not eligible for this release date`);
            }
            if (!exclusionMap.get(id)?.trim()) {
                throw new common_1.BadRequestException(`Exclusion reason is required for trip ${id}`);
            }
            if (includedSet.has(id)) {
                throw new common_1.BadRequestException(`Trip ${id} cannot be both included and excluded`);
            }
        }
        const includedOrExcluded = new Set([...includedSet, ...excludedIds]);
        const missing = [...eligibleIds].filter((id) => !includedOrExcluded.has(id));
        if (missing.length) {
            throw new common_1.BadRequestException(`Every eligible trip must be either included or excluded with a reason. Missing: ${missing.join(', ')}`);
        }
        const includedTrips = eligible.filter((t) => includedSet.has(t.id));
        if (includedTrips.length === 0) {
            throw new common_1.BadRequestException('Batch must include at least one trip, or do not create a batch');
        }
        const runsheetDates = includedTrips.map((t) => t.runsheetDate.getTime());
        const periodStart = new Date(Math.min(...runsheetDates));
        const periodEnd = new Date(Math.max(...runsheetDates));
        let totalTripPayout = new client_2.Prisma.Decimal(0);
        let totalAdminFee = new client_2.Prisma.Decimal(0);
        let totalReimbursables = new client_2.Prisma.Decimal(0);
        const batch = await this.prisma.payoutBatch.create({
            data: {
                tenantId,
                operatorId: dto.operatorId,
                clientAccountId: dto.clientAccountId,
                periodStart,
                periodEnd,
                targetReleaseDate,
                status: client_1.PayoutBatchStatus.DRAFT,
                totalTripPayout,
                totalAdminFee,
                totalReimbursables,
            },
        });
        for (const trip of includedTrips) {
            const fin = trip.finance;
            const payout = fin.netTripPayoutBeforeReimb ?? fin.payoutBase ?? new client_2.Prisma.Decimal(0);
            const admin = fin.adminFee ?? new client_2.Prisma.Decimal(0);
            const reimb = fin.approvedReimbursableAmount ?? new client_2.Prisma.Decimal(0);
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
                    payoutStatus: client_1.PayoutStatus.IN_BATCH,
                    payoutLedgerDate: new Date(),
                },
            });
        }
        for (const { tripId, reason } of dto.exclusions) {
            await this.prisma.payoutBatchExclusion.create({
                data: { payoutBatchId: batch.id, tripId, reason: reason.trim() },
            });
        }
        const driverTripPayouts = new Map();
        for (const trip of includedTrips) {
            if (!trip.assignedDriverId)
                continue;
            const payout = trip.finance.netTripPayoutBeforeReimb ?? trip.finance.payoutBase ?? new client_2.Prisma.Decimal(0);
            const current = driverTripPayouts.get(trip.assignedDriverId) ?? new client_2.Prisma.Decimal(0);
            driverTripPayouts.set(trip.assignedDriverId, current.add(payout));
        }
        let totalCashbondDeduction = new client_2.Prisma.Decimal(0);
        for (const [driverId, tripPayoutSum] of driverTripPayouts) {
            if (tripPayoutSum.lte(0))
                continue;
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
            if (balance >= cap)
                continue;
            const deduct = Math.min(CASHBOND_DEDUCTION, cap - balance);
            if (deduct <= 0)
                continue;
            await this.prisma.driverCashbondLedger.create({
                data: {
                    driverId,
                    payoutBatchId: batch.id,
                    amount: new client_2.Prisma.Decimal(deduct),
                    type: client_1.CashbondLedgerType.DEDUCTION,
                },
            });
            await this.prisma.driverCashbondAccount.update({
                where: { driverId },
                data: {
                    currentBalance: new client_2.Prisma.Decimal(balance + deduct),
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
    async getPayoutBatches(tenantId, query) {
        let targetReleaseFilter;
        if (query.targetReleaseDate) {
            const d = new Date(query.targetReleaseDate);
            const start = new Date(d);
            start.setHours(0, 0, 0, 0);
            const end = new Date(d);
            end.setHours(23, 59, 59, 999);
            targetReleaseFilter = { targetReleaseDate: { gte: start, lte: end } };
        }
        const where = {
            tenantId,
            ...(query.operatorId && { operatorId: query.operatorId }),
            ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
            ...(query.status && { status: query.status }),
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
    async getPayoutBatch(tenantId, batchId) {
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
            throw new common_1.NotFoundException('Payout batch not found');
        }
        return batch;
    }
    async setBatchHeld(tenantId, batchId, held) {
        const batch = await this.prisma.payoutBatch.findFirst({
            where: { id: batchId, tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Payout batch not found');
        }
        if (batch.status !== client_1.PayoutBatchStatus.CFO_APPROVED) {
            throw new common_1.BadRequestException('Only CFO-approved batches can be held or released');
        }
        return this.prisma.payoutBatch.update({
            where: { id: batchId },
            data: {
                held,
                ...(held === false ? { releasedAt: new Date() } : {}),
            },
        });
    }
    async approvePayoutBatchByFinMgr(tenantId, batchId, userId) {
        const batch = await this.prisma.payoutBatch.findFirst({
            where: { id: batchId, tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Payout batch not found');
        }
        if (batch.status !== client_1.PayoutBatchStatus.DRAFT) {
            throw new common_1.BadRequestException('Batch is not in DRAFT status');
        }
        const tripIds = await this.prisma.payoutBatchTrip.findMany({
            where: { payoutBatchId: batchId },
            select: { tripId: true },
        });
        await this.prisma.$transaction([
            this.prisma.tripFinance.updateMany({
                where: { tripId: { in: tripIds.map((t) => t.tripId) } },
                data: { payoutStatus: client_1.PayoutStatus.FIN_MGR_APPROVED },
            }),
            this.prisma.payoutBatch.update({
                where: { id: batchId },
                data: {
                    status: client_1.PayoutBatchStatus.FIN_MGR_APPROVED,
                    finMgrApprovedAt: new Date(),
                    finMgrApprovedByUserId: userId,
                },
            }),
        ]);
        return this.getPayoutBatch(tenantId, batchId);
    }
    async approvePayoutBatchByCfo(tenantId, batchId, userId) {
        const batch = await this.prisma.payoutBatch.findFirst({
            where: { id: batchId, tenantId },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Payout batch not found');
        }
        if (batch.status !== client_1.PayoutBatchStatus.FIN_MGR_APPROVED) {
            throw new common_1.BadRequestException('Batch must be approved by Finance Manager first');
        }
        const tripIds = await this.prisma.payoutBatchTrip.findMany({
            where: { payoutBatchId: batchId },
            select: { tripId: true },
        });
        const payslipFileKey = `payslips/${batchId}.pdf`;
        await this.prisma.$transaction([
            this.prisma.tripFinance.updateMany({
                where: { tripId: { in: tripIds.map((t) => t.tripId) } },
                data: { payoutStatus: client_1.PayoutStatus.CFO_APPROVED },
            }),
            this.prisma.payoutBatch.update({
                where: { id: batchId },
                data: {
                    status: client_1.PayoutBatchStatus.CFO_APPROVED,
                    cfoApprovedAt: new Date(),
                    cfoApprovedByUserId: userId,
                    payslipFileKey,
                },
            }),
        ]);
        const batchForPayslip = await this.getPayoutBatch(tenantId, batchId);
        try {
            await this.payslipService.generateAndSave(batchForPayslip);
        }
        catch {
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
    async updateReimbursables(tenantId, tripId, dto) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
            include: { finance: true },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_VERIFIED) {
            throw new common_1.ForbiddenException('POD must be verified');
        }
        const existing = trip.finance;
        if (!existing) {
            throw new common_1.BadRequestException('Mark Finance Doc Received and compute trip finance first');
        }
        const currentStatus = existing.reimbursableStatus ?? client_1.ReimbursableStatus.DRAFT;
        const newStatus = dto.reimbursableStatus ?? currentStatus;
        const allowedNext = {
            [client_1.ReimbursableStatus.DRAFT]: [client_1.ReimbursableStatus.SUBMITTED_TO_CLIENT],
            [client_1.ReimbursableStatus.SUBMITTED_TO_CLIENT]: [client_1.ReimbursableStatus.APPROVED, client_1.ReimbursableStatus.REJECTED],
            [client_1.ReimbursableStatus.APPROVED]: [],
            [client_1.ReimbursableStatus.REJECTED]: [],
        };
        if (newStatus !== currentStatus) {
            const allowed = allowedNext[currentStatus] ?? [];
            if (!allowed.includes(newStatus)) {
                throw new common_1.BadRequestException(`Invalid status transition: ${currentStatus} → ${newStatus}. Allowed: ${allowed.join(', ') || 'none'}`);
            }
        }
        const toll = dto.tollAmount ?? Number(existing.tollAmount ?? 0);
        const gas = dto.gasAmount ?? Number(existing.gasAmount ?? 0);
        const parking = dto.parkingAmount ?? Number(existing.parkingAmount ?? 0);
        return this.prisma.tripFinance.update({
            where: { tripId },
            data: {
                ...(dto.tollAmount !== undefined && { tollAmount: new client_2.Prisma.Decimal(dto.tollAmount) }),
                ...(dto.gasAmount !== undefined && { gasAmount: new client_2.Prisma.Decimal(dto.gasAmount) }),
                ...(dto.parkingAmount !== undefined && { parkingAmount: new client_2.Prisma.Decimal(dto.parkingAmount) }),
                reimbursableStatus: newStatus,
                ...(newStatus === client_1.ReimbursableStatus.APPROVED && {
                    approvedReimbursableAmount: new client_2.Prisma.Decimal(toll + gas + parking),
                }),
                ...(newStatus === client_1.ReimbursableStatus.REJECTED && {
                    approvedReimbursableAmount: null,
                }),
            },
        });
    }
    async submitOverrideRequest(userId, tenantId, tripId, reason) {
        const trip = await this.prisma.trip.findFirst({
            where: { id: tripId, tenantId },
            include: { finance: true },
        });
        if (!trip) {
            throw new common_1.NotFoundException('Trip not found');
        }
        if (trip.podStatus !== client_1.PODStatus.POD_VERIFIED) {
            throw new common_1.BadRequestException('Trip must be POD verified');
        }
        const existing = await this.prisma.payoutOverrideRequest.findUnique({
            where: { tripId },
        });
        if (existing) {
            throw new common_1.BadRequestException(existing.status === 'PENDING'
                ? 'An override request is already pending for this trip'
                : `Override request already ${existing.status.toLowerCase()}`);
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
    async approveOverrideRequest(tenantId, requestId, userId) {
        const request = await this.prisma.payoutOverrideRequest.findUnique({
            where: { id: requestId },
            include: { trip: { select: { id: true, tenantId: true } } },
        });
        if (!request || !request.trip || request.trip.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Override request not found');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('Request is not pending');
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
    async rejectOverrideRequest(tenantId, requestId, rejectionReason, userId) {
        const request = await this.prisma.payoutOverrideRequest.findUnique({
            where: { id: requestId },
            include: { trip: { select: { tenantId: true } } },
        });
        if (!request || !request.trip || request.trip.tenantId !== tenantId) {
            throw new common_1.NotFoundException('Override request not found');
        }
        if (request.status !== 'PENDING') {
            throw new common_1.BadRequestException('Request is not pending');
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
    async getFinanceDashboard(tenantId, query) {
        const tripWhere = { tenantId };
        if (query.clientAccountId)
            tripWhere.clientAccountId = query.clientAccountId;
        if (query.serviceCategoryId)
            tripWhere.serviceCategoryId = query.serviceCategoryId;
        if (query.operatorId)
            tripWhere.operatorIdAtAssignment = query.operatorId;
        if (query.dateFrom || query.dateTo) {
            tripWhere.runsheetDate = {};
            if (query.dateFrom)
                tripWhere.runsheetDate.gte = new Date(query.dateFrom);
            if (query.dateTo)
                tripWhere.runsheetDate.lte = new Date(query.dateTo);
        }
        const now = new Date();
        const sevenDaysFromNow = new Date(now);
        sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
        const [podVerifiedNotReceived, docReceivedNotComputed, billingReadyToBill, billingBilled, billingPaid, payoutReadyForPayout, payoutInBatch, payoutFinMgrApproved, payoutCfoApproved, payoutReleased, payoutPaid, reimbursablesPendingApproval, reimbursablesApprovedPendingBatch, overridesPendingCfo, overridesPendingList,] = await Promise.all([
            this.prisma.trip.count({
                where: {
                    ...tripWhere,
                    podStatus: client_1.PODStatus.POD_VERIFIED,
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
                where: { trip: tripWhere, billingStatus: client_1.BillingStatus.READY_TO_BILL },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, billingStatus: client_1.BillingStatus.BILLED },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, billingStatus: client_1.BillingStatus.PAID },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.READY_FOR_PAYOUT },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.IN_BATCH },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.FIN_MGR_APPROVED },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.CFO_APPROVED },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.RELEASED },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, payoutStatus: client_1.PayoutStatus.PAID },
            }),
            this.prisma.tripFinance.count({
                where: { trip: tripWhere, reimbursableStatus: client_1.ReimbursableStatus.SUBMITTED_TO_CLIENT },
            }),
            this.prisma.tripFinance.count({
                where: {
                    trip: tripWhere,
                    reimbursableStatus: client_1.ReimbursableStatus.APPROVED,
                    payoutStatus: client_1.PayoutStatus.READY_FOR_PAYOUT,
                },
            }),
            this.prisma.payoutOverrideRequest.count({
                where: { status: client_1.OverrideRequestStatus.PENDING, trip: tripWhere },
            }),
            this.prisma.payoutOverrideRequest.findMany({
                where: { status: client_1.OverrideRequestStatus.PENDING, trip: tripWhere },
                include: { trip: { select: { id: true, internalRef: true, runsheetDate: true } } },
                take: 50,
            }),
        ]);
        const podVerifiedNotReceivedList = await this.prisma.trip.findMany({
            where: {
                ...tripWhere,
                podStatus: client_1.PODStatus.POD_VERIFIED,
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
                podStatus: client_1.PODStatus.POD_VERIFIED,
            },
        });
        const tripsForDeadline = await this.prisma.trip.findMany({
            where: {
                ...tripWhere,
                podStatus: client_1.PODStatus.POD_VERIFIED,
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
            if (deadline >= now && deadline <= sevenDaysFromNow)
                expiringSoonCount++;
            if (deadline < now && t.overrideRequest?.status !== 'APPROVED')
                expiredBlockedCount++;
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
    async getArLedger(tenantId, query) {
        const tripWhere = { tenantId };
        if (query.clientAccountId)
            tripWhere.clientAccountId = query.clientAccountId;
        if (query.serviceCategoryId)
            tripWhere.serviceCategoryId = query.serviceCategoryId;
        if (query.dateFrom || query.dateTo) {
            tripWhere.runsheetDate = {};
            if (query.dateFrom)
                tripWhere.runsheetDate.gte = new Date(query.dateFrom);
            if (query.dateTo)
                tripWhere.runsheetDate.lte = new Date(query.dateTo);
        }
        const where = {
            trip: tripWhere,
            billingStatus: { in: [client_1.BillingStatus.READY_TO_BILL, client_1.BillingStatus.BILLED] },
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
            const amount = toNum(r.clientBillAmount ?? r.vatableBaseRate);
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
    async getApLedger(tenantId, query) {
        const tripWhere = { tenantId };
        if (query.operatorId)
            tripWhere.operatorIdAtAssignment = query.operatorId;
        if (query.clientAccountId)
            tripWhere.clientAccountId = query.clientAccountId;
        if (query.serviceCategoryId)
            tripWhere.serviceCategoryId = query.serviceCategoryId;
        const where = {
            trip: tripWhere,
            payoutStatus: { not: client_1.PayoutStatus.PAID },
        };
        if (query.dateFrom || query.dateTo) {
            where.payoutDueDate = {};
            if (query.dateFrom)
                where.payoutDueDate.gte = new Date(query.dateFrom);
            if (query.dateTo)
                where.payoutDueDate.lte = new Date(query.dateTo);
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
    computeAgingSummary(items) {
        const map = new Map();
        const buckets = ['0-30', '31-60', '61-90', '90+', 'no_date'];
        buckets.forEach((b) => map.set(b, { amount: 0, count: 0 }));
        for (const { bucket, amount } of items) {
            const b = bucket || 'no_date';
            if (!map.has(b))
                map.set(b, { amount: 0, count: 0 });
            const cur = map.get(b);
            cur.amount += amount;
            cur.count += 1;
        }
        return buckets.map((bucket) => ({
            bucket,
            amount: map.get(bucket).amount,
            count: map.get(bucket).count,
        }));
    }
    async getArBatches(tenantId, query) {
        const where = { tenantId };
        if (query.clientAccountId)
            where.clientAccountId = query.clientAccountId;
        if (query.serviceSegment)
            where.serviceSegment = query.serviceSegment;
        if (query.status)
            where.status = query.status;
        if (query.cutoffFrom)
            where.cutoffStartDate = { gte: new Date(query.cutoffFrom) };
        if (query.cutoffTo)
            where.cutoffEndDate = { lte: new Date(query.cutoffTo) };
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
    async getArBatchById(tenantId, id) {
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
        if (!batch)
            throw new common_1.NotFoundException('AR batch not found');
        return batch;
    }
    async attachInvoiceToArBatch(tenantId, userId, batchId, dto) {
        const batch = await this.prisma.arBatch.findFirst({
            where: { id: batchId, tenantId },
            include: { trips: { select: { tripId: true } } },
        });
        if (!batch)
            throw new common_1.NotFoundException('AR batch not found');
        if (batch.status !== 'REVERSE_BILLING_RECEIVED') {
            throw new common_1.BadRequestException('Invoice can only be attached when batch status is REVERSE_BILLING_RECEIVED');
        }
        const invoiceDate = new Date(dto.invoiceDate);
        if (isNaN(invoiceDate.getTime()))
            throw new common_1.BadRequestException('Invalid invoiceDate');
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
                    data: { billingStatus: client_1.BillingStatus.BILLED, billingLedgerDate: invoiceDate },
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
        }).catch(() => { });
        return this.getArBatchById(tenantId, batchId);
    }
    async markArBatchDeposited(tenantId, userId, batchId) {
        const batch = await this.prisma.arBatch.findFirst({
            where: { id: batchId, tenantId },
            include: { trips: { select: { tripId: true } } },
        });
        if (!batch)
            throw new common_1.NotFoundException('AR batch not found');
        if (batch.status !== 'PAYMENT_LIST_RECEIVED') {
            throw new common_1.BadRequestException('Batch must be in PAYMENT_LIST_RECEIVED status before marking deposited');
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
                    data: { billingStatus: client_1.BillingStatus.PAID },
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
        }).catch(() => { });
        return this.getArBatchById(tenantId, batchId);
    }
    async importReverseBillingCsv(params) {
        const { userId, tenantId, csvBuffer, commit, clientCode, serviceSegment, cutoffStartDate, cutoffEndDate } = params;
        const allowedSegments = Object.keys(this.SEGMENT_TO_CATEGORY_CODES);
        if (!allowedSegments.includes(serviceSegment)) {
            throw new common_1.BadRequestException(`service_segment must be one of: ${allowedSegments.join(', ')}`);
        }
        const cutoffStart = new Date(cutoffStartDate);
        const cutoffEnd = new Date(cutoffEndDate);
        if (isNaN(cutoffStart.getTime()) || isNaN(cutoffEnd.getTime())) {
            throw new common_1.BadRequestException('cutoff_start_date and cutoff_end_date must be valid ISO dates');
        }
        if (cutoffEnd < cutoffStart) {
            throw new common_1.BadRequestException('cutoff_end_date must be on or after cutoff_start_date');
        }
        const client = await this.prisma.clientAccount.findFirst({
            where: { tenantId, code: clientCode, status: 'ACTIVE' },
        });
        if (!client) {
            throw new common_1.BadRequestException(`Client not found for code: ${clientCode}`);
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
            throw new common_1.BadRequestException('CSV must have a header row with column: client_trip_ref');
        }
        const errors = [];
        const rows = [];
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
        const tripWhere = {
            tenantId,
            clientAccountId: client.id,
            serviceCategoryId: { in: categoryIds },
            runsheetDate: { gte: cutoffStart, lte: cutoffEnd },
        };
        const allTripsInPeriod = await this.prisma.trip.findMany({
            where: tripWhere,
            select: { id: true, internalRef: true, clientTripRef: true, externalRef: true, serviceCategoryId: true, runsheetDate: true },
        });
        const byClientRef = new Map();
        const byInternalRef = new Map();
        for (const t of allTripsInPeriod) {
            const ref = (t.clientTripRef || t.externalRef || '').trim();
            if (ref) {
                if (!byClientRef.has(ref))
                    byClientRef.set(ref, []);
                byClientRef.get(ref).push(t);
            }
            byInternalRef.set(t.internalRef, t);
        }
        const matchedTripIds = new Set();
        const unmatchedLines = [];
        for (const r of rows) {
            let trip;
            const byRef = byClientRef.get(r.clientTripRef.trim());
            if (byRef && byRef.length === 1) {
                trip = byRef[0];
            }
            else if (byRef && byRef.length > 1 && r.ourInternalRef) {
                trip = byRef.find((t) => t.internalRef === r.ourInternalRef) ?? byRef[0];
            }
            else if (r.ourInternalRef) {
                trip = byInternalRef.get(r.ourInternalRef.trim());
                if (trip && !categoryIds.includes(trip.serviceCategoryId))
                    trip = undefined;
            }
            if (trip) {
                matchedTripIds.add(trip.id);
            }
            else {
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
                        amountClient: u.amountClient ? new client_2.Prisma.Decimal(u.amountClient) : undefined,
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
        }).catch(() => { });
        return {
            mode: 'commit',
            totalRows: rows.length,
            matched: matchedTripIds.size,
            disputes: disputeTripIds.length,
            unmatched: unmatchedLines.length,
            errors: errors.length ? errors : undefined,
        };
    }
    async importPaymentListCsv(params) {
        const { userId, tenantId, csvBuffer, commit, clientCode, paymentListReceivedDate } = params;
        const receivedAt = new Date(paymentListReceivedDate);
        if (isNaN(receivedAt.getTime())) {
            throw new common_1.BadRequestException('payment_list_received_date must be a valid ISO date');
        }
        const client = await this.prisma.clientAccount.findFirst({
            where: { tenantId, code: clientCode, status: 'ACTIVE' },
        });
        if (!client) {
            throw new common_1.BadRequestException(`Client not found for code: ${clientCode}`);
        }
        const lines = parseCsvLines(csvBuffer);
        if (lines.length < 2) {
            return { mode: commit ? 'commit' : 'preview', totalRows: 0, updated: 0, errors: [], notFound: [] };
        }
        const header = lines[0].map((c) => (c || '').trim().toLowerCase());
        const invoiceNumberIdx = header.indexOf('invoice_number');
        const amountPaidIdx = header.indexOf('amount_paid');
        if (invoiceNumberIdx === -1) {
            throw new common_1.BadRequestException('CSV must have a header row with column: invoice_number');
        }
        const errors = [];
        const rows = [];
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
        const byInvoice = new Map();
        for (const b of batches) {
            if (b.invoiceNumber)
                byInvoice.set(b.invoiceNumber.trim(), b);
        }
        const toUpdate = [];
        const notFound = [];
        for (const r of rows) {
            const batch = byInvoice.get(r.invoiceNumber);
            if (batch)
                toUpdate.push({ batchId: batch.id, amountPaid: r.amountPaid });
            else
                notFound.push(r.invoiceNumber);
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
                    amountPaidFromClient: u.amountPaid ? new client_2.Prisma.Decimal(u.amountPaid) : undefined,
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
        }).catch(() => { });
        return {
            mode: 'commit',
            totalRows: rows.length,
            updated: toUpdate.length,
            notFound,
            errors: errors.length ? errors : undefined,
        };
    }
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        rates_service_1.RatesService,
        audit_service_1.AuditService,
        payslip_service_1.PayslipService])
], FinanceService);
function parseCsvLines(buffer) {
    const text = buffer.toString('utf-8').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = [];
    let current = [];
    let field = '';
    let inQuotes = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i];
        if (c === '"') {
            inQuotes = !inQuotes;
        }
        else if (inQuotes) {
            field += c;
        }
        else if (c === ',' || c === '\n') {
            current.push(field.trim());
            field = '';
            if (c === '\n') {
                lines.push(current);
                current = [];
            }
        }
        else {
            field += c;
        }
    }
    if (field || current.length > 0) {
        current.push(field.trim());
        lines.push(current);
    }
    return lines;
}
//# sourceMappingURL=finance.service.js.map