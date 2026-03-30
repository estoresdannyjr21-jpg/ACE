import { IncidentType, IncidentSeverity, IncidentStatus } from '@prisma/client';
export declare class GetIncidentsQueryDto {
    status?: IncidentStatus;
    severity?: IncidentSeverity;
    tripId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
}
export declare class CreateIncidentDto {
    tripId: string;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    description: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
}
export declare class AddIncidentUpdateDto {
    newStatus?: IncidentStatus;
    comment?: string;
}
export declare class ResolveIncidentDto {
    resolutionNotes: string;
    replacementTripId?: string;
}
export declare class AddIncidentMediaDto {
    fileKey: string;
}
