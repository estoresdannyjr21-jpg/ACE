import { FinanceService } from './finance.service';
import { CreatePayoutBatchDto, GetPayoutBatchesQueryDto, GetEligibleTripsQueryDto, SetBatchHeldDto, SubmitOverrideRequestDto, RejectOverrideRequestDto, UpdateReimbursablesDto } from './dto';
import { FinanceDashboardQueryDto } from './dto/finance-dashboard.dto';
import { ArLedgerQueryDto, ApLedgerQueryDto } from './dto/ar-ap-reports.dto';
import { GetArBatchesQueryDto, AttachInvoiceDto } from './dto/ar-batch.dto';
export declare class FinanceController {
    private service;
    constructor(service: FinanceService);
    getFinanceLookups(req: any): Promise<{
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
    getFinanceDashboard(req: any, query: FinanceDashboardQueryDto): Promise<{
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
    getArLedger(req: any, query: ArLedgerQueryDto): Promise<{
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
    getApLedger(req: any, query: ApLedgerQueryDto): Promise<{
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
    getTripByInternalRef(req: any, internalRef: string): Promise<{
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
            clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
            vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            payoutBase: import("@prisma/client/runtime/library").Decimal | null;
            adminFee: import("@prisma/client/runtime/library").Decimal | null;
            netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
            tollAmount: import("@prisma/client/runtime/library").Decimal | null;
            gasAmount: import("@prisma/client/runtime/library").Decimal | null;
            parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
            reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
            approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    markFinanceDocReceived(req: any, tripId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
        vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        payoutBase: import("@prisma/client/runtime/library").Decimal | null;
        adminFee: import("@prisma/client/runtime/library").Decimal | null;
        netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
        tollAmount: import("@prisma/client/runtime/library").Decimal | null;
        gasAmount: import("@prisma/client/runtime/library").Decimal | null;
        parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    computeTripFinance(req: any, tripId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
        vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        payoutBase: import("@prisma/client/runtime/library").Decimal | null;
        adminFee: import("@prisma/client/runtime/library").Decimal | null;
        netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
        tollAmount: import("@prisma/client/runtime/library").Decimal | null;
        gasAmount: import("@prisma/client/runtime/library").Decimal | null;
        parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    updateReimbursables(req: any, tripId: string, dto: UpdateReimbursablesDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tripId: string;
        financeDocReceivedAt: Date | null;
        clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
        vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
        payoutBase: import("@prisma/client/runtime/library").Decimal | null;
        adminFee: import("@prisma/client/runtime/library").Decimal | null;
        netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
        tollAmount: import("@prisma/client/runtime/library").Decimal | null;
        gasAmount: import("@prisma/client/runtime/library").Decimal | null;
        parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
        reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
        approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    getEligibleTripsForRelease(req: any, query: GetEligibleTripsQueryDto): Promise<({
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
            clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
            vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            payoutBase: import("@prisma/client/runtime/library").Decimal | null;
            adminFee: import("@prisma/client/runtime/library").Decimal | null;
            netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
            tollAmount: import("@prisma/client/runtime/library").Decimal | null;
            gasAmount: import("@prisma/client/runtime/library").Decimal | null;
            parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
            reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
            approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
    createPayoutBatch(req: any, dto: CreatePayoutBatchDto): Promise<{
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
            snapshotTripPayout: import("@prisma/client/runtime/library").Decimal;
            snapshotAdminFee: import("@prisma/client/runtime/library").Decimal;
            snapshotReimbursables: import("@prisma/client/runtime/library").Decimal;
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    getPayoutBatches(req: any, query: GetPayoutBatchesQueryDto): Promise<({
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    })[]>;
    getPayoutBatch(req: any, id: string): Promise<{
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
            snapshotTripPayout: import("@prisma/client/runtime/library").Decimal;
            snapshotAdminFee: import("@prisma/client/runtime/library").Decimal;
            snapshotReimbursables: import("@prisma/client/runtime/library").Decimal;
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    approveByFinMgr(req: any, id: string): Promise<{
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
            snapshotTripPayout: import("@prisma/client/runtime/library").Decimal;
            snapshotAdminFee: import("@prisma/client/runtime/library").Decimal;
            snapshotReimbursables: import("@prisma/client/runtime/library").Decimal;
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    approveByCfo(req: any, id: string): Promise<{
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
            snapshotTripPayout: import("@prisma/client/runtime/library").Decimal;
            snapshotAdminFee: import("@prisma/client/runtime/library").Decimal;
            snapshotReimbursables: import("@prisma/client/runtime/library").Decimal;
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    setBatchHeld(req: any, id: string, dto: SetBatchHeldDto): Promise<{
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
        totalTripPayout: import("@prisma/client/runtime/library").Decimal;
        totalAdminFee: import("@prisma/client/runtime/library").Decimal;
        totalReimbursables: import("@prisma/client/runtime/library").Decimal;
        totalCashbondDeduction: import("@prisma/client/runtime/library").Decimal;
        netPayable: import("@prisma/client/runtime/library").Decimal;
        finMgrApprovedAt: Date | null;
        finMgrApprovedByUserId: string | null;
        cfoApprovedAt: Date | null;
        cfoApprovedByUserId: string | null;
        payslipFileKey: string | null;
    }>;
    submitOverrideRequest(req: any, tripId: string, dto: SubmitOverrideRequestDto): Promise<{
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
    approveOverrideRequest(req: any, id: string): Promise<{
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
    rejectOverrideRequest(req: any, id: string, dto: RejectOverrideRequestDto): Promise<{
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
    getArBatches(req: any, query: GetArBatchesQueryDto): Promise<({
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
        amountPaidFromClient: import("@prisma/client/runtime/library").Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    })[]>;
    getArBatchById(req: any, id: string): Promise<{
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
                    clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
                    vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    payoutBase: import("@prisma/client/runtime/library").Decimal | null;
                    adminFee: import("@prisma/client/runtime/library").Decimal | null;
                    netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
                    tollAmount: import("@prisma/client/runtime/library").Decimal | null;
                    gasAmount: import("@prisma/client/runtime/library").Decimal | null;
                    parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
            amountClient: import("@prisma/client/runtime/library").Decimal | null;
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
        amountPaidFromClient: import("@prisma/client/runtime/library").Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    attachInvoice(req: any, id: string, dto: AttachInvoiceDto): Promise<{
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
                    clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
                    vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    payoutBase: import("@prisma/client/runtime/library").Decimal | null;
                    adminFee: import("@prisma/client/runtime/library").Decimal | null;
                    netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
                    tollAmount: import("@prisma/client/runtime/library").Decimal | null;
                    gasAmount: import("@prisma/client/runtime/library").Decimal | null;
                    parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
            amountClient: import("@prisma/client/runtime/library").Decimal | null;
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
        amountPaidFromClient: import("@prisma/client/runtime/library").Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    markArBatchDeposited(req: any, id: string): Promise<{
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
                    clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
                    vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
                    payoutBase: import("@prisma/client/runtime/library").Decimal | null;
                    adminFee: import("@prisma/client/runtime/library").Decimal | null;
                    netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
                    tollAmount: import("@prisma/client/runtime/library").Decimal | null;
                    gasAmount: import("@prisma/client/runtime/library").Decimal | null;
                    parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
                    reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
                    approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
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
            amountClient: import("@prisma/client/runtime/library").Decimal | null;
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
        amountPaidFromClient: import("@prisma/client/runtime/library").Decimal | null;
        checkPickupDate: Date | null;
        depositedAt: Date | null;
    }>;
    importReverseBilling(req: any, file: Express.Multer.File, commit?: string, clientCode?: string, serviceSegment?: string, cutoffStartDate?: string, cutoffEndDate?: string): Promise<{
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
    importPaymentList(req: any, file: Express.Multer.File, commit?: string, clientCode?: string, paymentListReceivedDate?: string): Promise<{
        mode: string;
        totalRows: number;
        updated: number;
        notFound: string[];
        errors: string[];
    }>;
}
