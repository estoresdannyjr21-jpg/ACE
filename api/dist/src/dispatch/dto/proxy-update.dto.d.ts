import { EventType, IncidentSeverity, IncidentStatus, IncidentType } from '@prisma/client';
export declare class ProxyTripEventDto {
    reason: string;
    eventType: EventType;
    eventTime: string;
    stopId?: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
    capturedOffline?: boolean;
    mediaFileKeys: string[];
}
export declare class ProxyPodUploadDto {
    reason: string;
    fileKey: string;
}
export declare class ProxyReimbursableDocDto {
    reason: string;
    docType: 'TOLL' | 'GAS' | 'PARKING';
    fileKey: string;
}
export declare class ProxyCreateIncidentDto {
    reason: string;
    incidentType: IncidentType;
    severity: IncidentSeverity;
    description: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
}
export declare class ProxyIncidentUpdateDto {
    reason: string;
    newStatus?: IncidentStatus;
    comment?: string;
}
export declare class ProxyIncidentResolveDto {
    reason: string;
    resolutionNotes: string;
    replacementTripId?: string;
}
