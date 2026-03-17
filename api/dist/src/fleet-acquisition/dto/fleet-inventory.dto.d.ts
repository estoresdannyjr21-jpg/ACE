export declare class CreateFleetInventoryDto {
    clientAccountId: string;
    vehicleId: string;
    tagType: string;
    effectiveStart: string;
    effectiveEnd?: string;
}
export declare class UpdateFleetInventoryDto {
    effectiveEnd?: string;
    status?: string;
}
export declare class GetFleetInventoryQueryDto {
    clientAccountId?: string;
    vehicleId?: string;
    effectiveOn?: string;
}
