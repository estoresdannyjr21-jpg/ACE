import { Response } from 'express';
import { OperatorService } from './operator.service';
import { UploadService } from '../upload/upload.service';
export declare class OperatorController {
    private readonly service;
    private readonly upload;
    constructor(service: OperatorService, upload: UploadService);
    getTrips(req: any, query: any): Promise<({
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
    })[]>;
    getPayoutBatches(req: any): Promise<({
        _count: {
            trips: number;
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
    }>;
    getPayslip(req: any, id: string, res: Response): Promise<void>;
}
