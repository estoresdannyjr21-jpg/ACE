import { ConfigService } from '@nestjs/config';
import { Decimal } from '@prisma/client/runtime/library';
export interface PayoutBatchForPayslip {
    id: string;
    periodStart: Date;
    periodEnd: Date;
    totalTripPayout: Decimal;
    totalAdminFee: Decimal;
    totalReimbursables: Decimal;
    totalCashbondDeduction: Decimal;
    netPayable: Decimal;
    operator: {
        name: string;
    };
    clientAccount: {
        name: string;
        code: string;
    };
    trips: Array<{
        trip: {
            internalRef: string;
            runsheetDate: Date;
            originArea: string;
            destinationArea: string;
        };
        snapshotTripPayout: Decimal;
        snapshotReimbursables: Decimal;
    }>;
}
export declare class PayslipService {
    private config;
    constructor(config: ConfigService);
    generateAndSave(batch: PayoutBatchForPayslip): Promise<{
        fileKey: string;
    }>;
    private generatePdf;
}
