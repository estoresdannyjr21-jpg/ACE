export declare class CreateRouteRateDto {
    clientAccountId: string;
    serviceCategoryId: string;
    originArea: string;
    destinationArea: string;
    effectiveStart: string;
    effectiveEnd?: string;
    billRateAmount: number;
    tripPayoutRateVatable: number;
}
export declare class UpdateRouteRateDto {
    originArea?: string;
    destinationArea?: string;
    effectiveStart?: string;
    effectiveEnd?: string;
    billRateAmount?: number;
    tripPayoutRateVatable?: number;
}
export declare class GetRouteRatesQueryDto {
    clientAccountId?: string;
    serviceCategoryId?: string;
    originArea?: string;
    destinationArea?: string;
    effectiveOn?: string;
}
