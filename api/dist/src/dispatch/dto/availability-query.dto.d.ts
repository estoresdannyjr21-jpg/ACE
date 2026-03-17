import { DriverAvailabilityStatus } from '@prisma/client';
export declare class DriverAvailabilityQueryDto {
    date?: string;
    from?: string;
    to?: string;
    status?: DriverAvailabilityStatus;
    codingDay?: boolean;
}
