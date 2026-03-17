import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
export declare class OperatorService {
    private prisma;
    constructor(prisma: PrismaService);
    getTrips(tenantId: string, operatorId: string | null | undefined, query: any): Promise<({
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
    getPayoutBatches(tenantId: string, operatorId: string | null | undefined): Promise<({
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
    getPayoutBatch(tenantId: string, operatorId: string | null | undefined, batchId: string): Promise<{
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
    }>;
}
