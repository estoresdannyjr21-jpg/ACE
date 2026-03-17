import { AssignmentStatus, HighLevelTripStatus, PODStatus } from '@prisma/client';
export declare class GetTripsQueryDto {
    dateFrom?: string;
    dateTo?: string;
    assignmentStatus?: AssignmentStatus;
    highLevelTripStatus?: HighLevelTripStatus;
    podStatus?: PODStatus;
    clientAccountId?: string;
    internalRef?: string;
}
export declare class CreateTripDto {
    clientAccountId: string;
    serviceCategoryId: string;
    externalRef?: string;
    requestDeliveryDate?: string;
    runsheetDate: string;
    abStatus?: string;
    originArea: string;
    destinationArea: string;
    routeCode?: string;
    tripOrder?: number;
    callTime: string;
    vehicleType: string;
    assignedDriverId: string;
    assignedVehicleId: string;
}
export declare class VerifyPODDto {
    notes?: string;
}
export declare class RejectPODDto {
    comment: string;
    reason?: string;
}
