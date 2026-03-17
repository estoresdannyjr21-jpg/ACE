import { BillingStatus, PayoutStatus } from '@prisma/client';
export declare class FinanceDashboardQueryDto {
    clientAccountId?: string;
    serviceCategoryId?: string;
    operatorId?: string;
    dateFrom?: string;
    dateTo?: string;
    billingStatus?: BillingStatus;
    payoutStatus?: PayoutStatus;
}
