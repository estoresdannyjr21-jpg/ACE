import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { RatesService } from '../rates/rates.service';
import { PayslipService } from './payslip.service';
import { ReimbursableStatus } from '@prisma/client';
import { Prisma } from '@prisma/client';
export declare class FinanceService {
    private prisma;
    private ratesService;
    private audit;
    private payslipService;
    constructor(prisma: PrismaService, ratesService: RatesService, audit: AuditService, payslipService: PayslipService);
    getFinanceLookups(tenantId: string): Promise<{
        clients: {
            id: string;
            name: string;
            code: string;
            serviceCategories: {
                id: string;
                name: string;
                code: string;
            }[];
        }[];
        operators: {
            id: string;
            name: string;
        }[];
    }>;
    getTripByInternalRef(tenantId: string, internalRef: string): Promise<{
        clientAccount: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            code: string;
        };
        serviceCategory: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            code: string;
            clientAccountId: string;
            segmentType: string;
        };
        documents: {
            id: string;
            tripId: string;
            fileKey: string;
            uploadedAt: Date;
            docType: import(".prisma/client").$Enums.DocumentType;
            uploadedByUserId: string | null;
        }[];
        assignedDriver: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            tenantId: string;
            firstName: string;
            lastName: string;
            status: string;
            phone: string | null;
            spxDriverId: string | null;
            licenseNumber: string | null;
        };
        assignedVehicle: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            plateNumber: string;
            vehicleType: string;
            bodyType: string | null;
        };
        finance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tripId: string;
            financeDocReceivedAt: Date | null;
            clientBillAmount: Prisma.Decimal | null;
            vatableBaseRate: Prisma.Decimal | null;
            nonVatBaseRate: Prisma.Decimal | null;
            payoutBase: Prisma.Decimal | null;
            adminFee: Prisma.Decimal | null;
            netTripPayoutBeforeReimb: Prisma.Decimal | null;
            tollAmount: Prisma.Decimal | null;
            gasAmount: Prisma.Decimal | null;
            parkingAmount: Prisma.Decimal | null;
            reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
            approvedReimbursableAmount: Prisma.Decimal | null;
            billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
            billingLedgerDate: Date | null;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
            payoutLedgerDate: Date | null;
            payoutDueDate: Date | null;
            overrideExpiredDeadline: boolean;
            overrideRequestId: string | null;
            billingDispute: boolean;
            billingDisputeReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    markFinanceDocReceived(userId: string, tenantId: string, tripId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: Prisma.Decimal | null;
        vatableBaseRate: Prisma.Decimal | null;
        nonVatBaseRate: Prisma.Decimal | null;
        payoutBase: Prisma.Decimal | null;
        adminFee: Prisma.Decimal | null;
        netTripPayoutBeforeReimb: Prisma.Decimal | null;
        tollAmount: Prisma.Decimal | null;
        gasAmount: Prisma.Decimal | null;
        parkingAmount: Prisma.Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: Prisma.Decimal | null;
        billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
        billingLedgerDate: Date | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
        payoutLedgerDate: Date | null;
        payoutDueDate: Date | null;
        overrideExpiredDeadline: boolean;
        overrideRequestId: string | null;
        billingDispute: boolean;
        billingDisputeReason: string | null;
    }>;
    computeTripFinance(tenantId: string, tripId: string, userId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: Prisma.Decimal | null;
        vatableBaseRate: Prisma.Decimal | null;
        nonVatBaseRate: Prisma.Decimal | null;
        payoutBase: Prisma.Decimal | null;
        adminFee: Prisma.Decimal | null;
        netTripPayoutBeforeReimb: Prisma.Decimal | null;
        tollAmount: Prisma.Decimal | null;
        gasAmount: Prisma.Decimal | null;
        parkingAmount: Prisma.Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: Prisma.Decimal | null;
        billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
        billingLedgerDate: Date | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
        payoutLedgerDate: Date | null;
        payoutDueDate: Date | null;
        overrideExpiredDeadline: boolean;
        overrideRequestId: string | null;
        billingDispute: boolean;
        billingDisputeReason: string | null;
    }>;
    getEligibleTripsForRelease(tenantId: string, params: {
        targetReleaseDate: string;
        operatorId: string;
        clientAccountId: string;
    }): Promise<({
        serviceCategory: {
            name: string;
            code: string;
        };
        assignedDriver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        finance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tripId: string;
            financeDocReceivedAt: Date | null;
            clientBillAmount: Prisma.Decimal | null;
            vatableBaseRate: Prisma.Decimal | null;
            nonVatBaseRate: Prisma.Decimal | null;
            payoutBase: Prisma.Decimal | null;
            adminFee: Prisma.Decimal | null;
            netTripPayoutBeforeReimb: Prisma.Decimal | null;
            tollAmount: Prisma.Decimal | null;
            gasAmount: Prisma.Decimal | null;
            parkingAmount: Prisma.Decimal | null;
            reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
            approvedReimbursableAmount: Prisma.Decimal | null;
            billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
            billingLedgerDate: Date | null;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
            payoutLedgerDate: Date | null;
            payoutDueDate: Date | null;
            overrideExpiredDeadline: boolean;
            overrideRequestId: string | null;
            billingDispute: boolean;
            billingDisputeReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    })[]>;
    createPayoutBatch(tenantId: string, dto: {
        operatorId: string;
        clientAccountId: string;
        targetReleaseDate: string;
        includedTripIds: string[];
        exclusions: {
            tripId: string;
            reason: string;
        }[];
    }): Promise<{
        trips: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
                originArea: string;
                destinationArea: string;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            snapshotTripPayout: Prisma.Decimal;
            snapshotAdminFee: Prisma.Decimal;
            snapshotReimbursables: Prisma.Decimal;
            payoutBatchId: string;
        })[];
        operator: {
            id: string;
            name: string;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        exclusions: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            reason: string;
            payoutBatchId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    getPayoutBatches(tenantId: string, query: {
        operatorId?: string;
        clientAccountId?: string;
        status?: string;
        targetReleaseDate?: string;
    }): Promise<({
        _count: {
            trips: number;
        };
        operator: {
            id: string;
            name: string;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    })[]>;
    getPayoutBatch(tenantId: string, batchId: string): Promise<{
        trips: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
                originArea: string;
                destinationArea: string;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            snapshotTripPayout: Prisma.Decimal;
            snapshotAdminFee: Prisma.Decimal;
            snapshotReimbursables: Prisma.Decimal;
            payoutBatchId: string;
        })[];
        operator: {
            id: string;
            name: string;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        exclusions: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            reason: string;
            payoutBatchId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    setBatchHeld(tenantId: string, batchId: string, held: boolean): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    approvePayoutBatchByFinMgr(tenantId: string, batchId: string, userId: string): Promise<{
        trips: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
                originArea: string;
                destinationArea: string;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            snapshotTripPayout: Prisma.Decimal;
            snapshotAdminFee: Prisma.Decimal;
            snapshotReimbursables: Prisma.Decimal;
            payoutBatchId: string;
        })[];
        operator: {
            id: string;
            name: string;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        exclusions: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            reason: string;
            payoutBatchId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    approvePayoutBatchByCfo(tenantId: string, batchId: string, userId: string): Promise<{
        trips: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
                originArea: string;
                destinationArea: string;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            snapshotTripPayout: Prisma.Decimal;
            snapshotAdminFee: Prisma.Decimal;
            snapshotReimbursables: Prisma.Decimal;
            payoutBatchId: string;
        })[];
        operator: {
            id: string;
            name: string;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        exclusions: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            reason: string;
            payoutBatchId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: import(".prisma/client").$Enums.PayoutBatchStatus;
        operatorId: string;
        clientAccountId: string;
        periodStart: Date;
        periodEnd: Date;
        targetReleaseDate: Date | null;
        held: boolean;
        releasedAt: Date | null;
        totalTripPayout: Prisma.Decimal;
        totalAdminFee: Prisma.Decimal;
        totalReimbursables: Prisma.Decimal;
        totalCashbondDeduction: Prisma.Decimal;
        netPayable: Prisma.Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    updateReimbursables(tenantId: string, tripId: string, dto: {
        tollAmount?: number;
        gasAmount?: number;
        parkingAmount?: number;
        reimbursableStatus?: ReimbursableStatus;
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: Prisma.Decimal | null;
        vatableBaseRate: Prisma.Decimal | null;
        nonVatBaseRate: Prisma.Decimal | null;
        payoutBase: Prisma.Decimal | null;
        adminFee: Prisma.Decimal | null;
        netTripPayoutBeforeReimb: Prisma.Decimal | null;
        tollAmount: Prisma.Decimal | null;
        gasAmount: Prisma.Decimal | null;
        parkingAmount: Prisma.Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: Prisma.Decimal | null;
        billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
        billingLedgerDate: Date | null;
        payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
        payoutLedgerDate: Date | null;
        payoutDueDate: Date | null;
        overrideExpiredDeadline: boolean;
        overrideRequestId: string | null;
        billingDispute: boolean;
        billingDisputeReason: string | null;
    }>;
    submitOverrideRequest(userId: string, tenantId: string, tripId: string, reason: string): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
        submitter: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OverrideRequestStatus;
        tripId: string;
        reason: string;
        submittedByUserId: string;
        approvedByUserId: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
    }>;
    approveOverrideRequest(tenantId: string, requestId: string, userId: string): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
        approver: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OverrideRequestStatus;
        tripId: string;
        reason: string;
        submittedByUserId: string;
        approvedByUserId: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
    }>;
    rejectOverrideRequest(tenantId: string, requestId: string, rejectionReason: string, userId: string): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.OverrideRequestStatus;
        tripId: string;
        reason: string;
        submittedByUserId: string;
        approvedByUserId: string | null;
        approvedAt: Date | null;
        rejectionReason: string | null;
    }>;
    getFinanceDashboard(tenantId: string, query: {
        clientAccountId?: string;
        serviceCategoryId?: string;
        operatorId?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<{
        counts: {
            podVerifiedNotReceived: number;
            docReceivedNotComputed: number;
            billingReadyToBill: number;
            billingBilled: number;
            billingPaid: number;
            payoutReadyForPayout: number;
            payoutInBatch: number;
            payoutFinMgrApproved: number;
            payoutCfoApproved: number;
            payoutReleased: number;
            payoutPaid: number;
            reimbursablesPendingApproval: number;
            reimbursablesApprovedPendingBatch: number;
            subconExpiringSoon: number;
            subconExpiredBlocked: number;
            overridesPendingCfo: number;
        };
        podVerifiedNotReceivedList: {
            id: string;
            internalRef: string;
            runsheetDate: Date;
            podStatus: import(".prisma/client").$Enums.PODStatus;
            assignedDriver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        }[];
        docReceivedNotComputedList: {
            id: string;
            internalRef: string;
            runsheetDate: Date;
            assignedDriver: {
                id: string;
                firstName: string;
                lastName: string;
            };
            finance: {
                id: string;
                financeDocReceivedAt: Date;
            };
        }[];
        overridesPendingList: ({
            trip: {
                id: string;
                internalRef: string;
                runsheetDate: Date;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            status: import(".prisma/client").$Enums.OverrideRequestStatus;
            tripId: string;
            reason: string;
            submittedByUserId: string;
            approvedByUserId: string | null;
            approvedAt: Date | null;
            rejectionReason: string | null;
        })[];
    }>;
    getArLedger(tenantId: string, query: {
        clientAccountId?: string;
        serviceCategoryId?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        ledger: {
            tripFinanceId: string;
            tripId: string;
            internalRef: string;
            runsheetDate: Date;
            clientAccountId: string;
            clientAccountName: string;
            serviceCategoryName: string;
            billingStatus: import(".prisma/client").$Enums.BillingStatus;
            billingLedgerDate: Date;
            amount: number;
            agingBucket: string;
        }[];
        aging: {
            bucket: string;
            amount: number;
            count: number;
        }[];
        totalReceivable: number;
        totalCount: number;
    }>;
    getApLedger(tenantId: string, query: {
        operatorId?: string;
        clientAccountId?: string;
        serviceCategoryId?: string;
        dateFrom?: string;
        dateTo?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        ledger: {
            tripFinanceId: string;
            tripId: string;
            internalRef: string;
            runsheetDate: Date;
            operatorId: string;
            operatorName: string;
            clientAccountName: string;
            serviceCategoryName: string;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus;
            payoutDueDate: Date;
            amount: number;
            agingBucket: string;
        }[];
        aging: {
            bucket: string;
            amount: number;
            count: number;
        }[];
        totalPayable: number;
        totalCount: number;
    }>;
    private computeAgingSummary;
    getArBatches(tenantId: string, query: {
        clientAccountId?: string;
        serviceSegment?: string;
        status?: string;
        cutoffFrom?: string;
        cutoffTo?: string;
    }): Promise<({
        _count: {
            trips: number;
            unmatchedLines: number;
        };
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        clientAccountId: string;
        serviceSegment: string;
        cutoffStartDate: Date;
        cutoffEndDate: Date;
        reverseBillingReceivedAt: Date | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        paymentListReceivedAt: Date | null;
        amountPaidFromClient: Prisma.Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    })[]>;
    getArBatchById(tenantId: string, id: string): Promise<{
        trips: ({
            trip: {
                id: string;
                serviceCategory: {
                    id: string;
                    name: string;
                    code: string;
                };
                internalRef: string;
                externalRef: string;
                runsheetDate: Date;
                clientTripRef: string;
                finance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    tripId: string;
                    financeDocReceivedAt: Date | null;
                    clientBillAmount: Prisma.Decimal | null;
                    vatableBaseRate: Prisma.Decimal | null;
                    nonVatBaseRate: Prisma.Decimal | null;
                    payoutBase: Prisma.Decimal | null;
                    adminFee: Prisma.Decimal | null;
                    netTripPayoutBeforeReimb: Prisma.Decimal | null;
                    tollAmount: Prisma.Decimal | null;
                    gasAmount: Prisma.Decimal | null;
                    parkingAmount: Prisma.Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: Prisma.Decimal | null;
                    billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
                    billingLedgerDate: Date | null;
                    payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
                    payoutLedgerDate: Date | null;
                    payoutDueDate: Date | null;
                    overrideExpiredDeadline: boolean;
                    overrideRequestId: string | null;
                    billingDispute: boolean;
                    billingDisputeReason: string | null;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            arBatchId: string;
        })[];
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        unmatchedLines: {
            id: string;
            runsheetDate: Date | null;
            uploadedAt: Date;
            notes: string | null;
            uploadedByUserId: string | null;
            arBatchId: string;
            clientProvidedRef: string;
            ourInternalRef: string | null;
            serviceCategoryCode: string | null;
            amountClient: Prisma.Decimal | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        clientAccountId: string;
        serviceSegment: string;
        cutoffStartDate: Date;
        cutoffEndDate: Date;
        reverseBillingReceivedAt: Date | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        paymentListReceivedAt: Date | null;
        amountPaidFromClient: Prisma.Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    attachInvoiceToArBatch(tenantId: string, userId: string, batchId: string, dto: {
        invoiceNumber: string;
        invoiceDate: string;
    }): Promise<{
        trips: ({
            trip: {
                id: string;
                serviceCategory: {
                    id: string;
                    name: string;
                    code: string;
                };
                internalRef: string;
                externalRef: string;
                runsheetDate: Date;
                clientTripRef: string;
                finance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    tripId: string;
                    financeDocReceivedAt: Date | null;
                    clientBillAmount: Prisma.Decimal | null;
                    vatableBaseRate: Prisma.Decimal | null;
                    nonVatBaseRate: Prisma.Decimal | null;
                    payoutBase: Prisma.Decimal | null;
                    adminFee: Prisma.Decimal | null;
                    netTripPayoutBeforeReimb: Prisma.Decimal | null;
                    tollAmount: Prisma.Decimal | null;
                    gasAmount: Prisma.Decimal | null;
                    parkingAmount: Prisma.Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: Prisma.Decimal | null;
                    billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
                    billingLedgerDate: Date | null;
                    payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
                    payoutLedgerDate: Date | null;
                    payoutDueDate: Date | null;
                    overrideExpiredDeadline: boolean;
                    overrideRequestId: string | null;
                    billingDispute: boolean;
                    billingDisputeReason: string | null;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            arBatchId: string;
        })[];
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        unmatchedLines: {
            id: string;
            runsheetDate: Date | null;
            uploadedAt: Date;
            notes: string | null;
            uploadedByUserId: string | null;
            arBatchId: string;
            clientProvidedRef: string;
            ourInternalRef: string | null;
            serviceCategoryCode: string | null;
            amountClient: Prisma.Decimal | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        clientAccountId: string;
        serviceSegment: string;
        cutoffStartDate: Date;
        cutoffEndDate: Date;
        reverseBillingReceivedAt: Date | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        paymentListReceivedAt: Date | null;
        amountPaidFromClient: Prisma.Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    markArBatchDeposited(tenantId: string, userId: string, batchId: string): Promise<{
        trips: ({
            trip: {
                id: string;
                serviceCategory: {
                    id: string;
                    name: string;
                    code: string;
                };
                internalRef: string;
                externalRef: string;
                runsheetDate: Date;
                clientTripRef: string;
                finance: {
                    id: string;
                    createdAt: Date;
                    updatedAt: Date;
                    tripId: string;
                    financeDocReceivedAt: Date | null;
                    clientBillAmount: Prisma.Decimal | null;
                    vatableBaseRate: Prisma.Decimal | null;
                    nonVatBaseRate: Prisma.Decimal | null;
                    payoutBase: Prisma.Decimal | null;
                    adminFee: Prisma.Decimal | null;
                    netTripPayoutBeforeReimb: Prisma.Decimal | null;
                    tollAmount: Prisma.Decimal | null;
                    gasAmount: Prisma.Decimal | null;
                    parkingAmount: Prisma.Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: Prisma.Decimal | null;
                    billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
                    billingLedgerDate: Date | null;
                    payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
                    payoutLedgerDate: Date | null;
                    payoutDueDate: Date | null;
                    overrideExpiredDeadline: boolean;
                    overrideRequestId: string | null;
                    billingDispute: boolean;
                    billingDisputeReason: string | null;
                };
            };
        } & {
            id: string;
            createdAt: Date;
            tripId: string;
            arBatchId: string;
        })[];
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        unmatchedLines: {
            id: string;
            runsheetDate: Date | null;
            uploadedAt: Date;
            notes: string | null;
            uploadedByUserId: string | null;
            arBatchId: string;
            clientProvidedRef: string;
            ourInternalRef: string | null;
            serviceCategoryCode: string | null;
            amountClient: Prisma.Decimal | null;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        clientAccountId: string;
        serviceSegment: string;
        cutoffStartDate: Date;
        cutoffEndDate: Date;
        reverseBillingReceivedAt: Date | null;
        invoiceNumber: string | null;
        invoiceDate: Date | null;
        paymentListReceivedAt: Date | null;
        amountPaidFromClient: Prisma.Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    private readonly SEGMENT_TO_CATEGORY_CODES;
    importReverseBillingCsv(params: {
        userId: string;
        tenantId: string;
        csvBuffer: Buffer;
        commit: boolean;
        clientCode: string;
        serviceSegment: 'FM_ONCALL' | 'FM_WETLEASE' | 'MFM_ONCALL';
        cutoffStartDate: string;
        cutoffEndDate: string;
    }): Promise<{
        mode: string;
        totalRows: number;
        matched: number;
        disputes: number;
        unmatched: number;
        errors: string[];
        unmatchedLines: {
            clientTripRef: string;
            ourInternalRef?: string;
            serviceCategoryCode?: string;
            runsheetDate?: string;
            amountClient?: string;
        }[];
    } | {
        mode: string;
        totalRows: number;
        matched: number;
        disputes: number;
        unmatched: number;
        errors: string[];
        unmatchedLines?: undefined;
    }>;
    importPaymentListCsv(params: {
        userId: string;
        tenantId: string;
        csvBuffer: Buffer;
        commit: boolean;
        clientCode: string;
        paymentListReceivedDate: string;
    }): Promise<{
        mode: string;
        totalRows: number;
        updated: number;
        notFound: string[];
        errors: string[];
    }>;
}
