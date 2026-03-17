import { DriverAvailabilityStatus } from '@prisma/client';
export declare class SetAvailabilityItemDto {
    date: string;
    status: DriverAvailabilityStatus;
    note?: string;
    codingDay?: boolean;
}
export declare class SetAvailabilityDto {
    items: SetAvailabilityItemDto[];
}
export declare class GetAvailabilityQueryDto {
    from?: string;
    to?: string;
}
