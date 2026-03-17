import { AssignmentStatus, HighLevelTripStatus } from '@prisma/client';
export declare class GetMyTripsQueryDto {
    assignmentStatus?: AssignmentStatus;
    highLevelTripStatus?: HighLevelTripStatus;
}
export declare class DeclineTripDto {
    reason?: string;
}
