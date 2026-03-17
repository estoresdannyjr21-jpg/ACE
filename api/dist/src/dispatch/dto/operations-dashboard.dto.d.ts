import { AssignmentStatus, HighLevelTripStatus, IncidentSeverity, IncidentStatus, PODStatus } from '@prisma/client';
export declare class OperationsDashboardQueryDto {
    clientAccountId?: string;
    serviceCategoryId?: string;
    operatorId?: string;
    driverId?: string;
    dateFrom?: string;
    dateTo?: string;
    assignmentStatus?: AssignmentStatus;
    highLevelTripStatus?: HighLevelTripStatus;
    podStatus?: PODStatus;
    originArea?: string;
    destinationArea?: string;
    incidentStatus?: IncidentStatus;
    incidentSeverity?: IncidentSeverity;
}
