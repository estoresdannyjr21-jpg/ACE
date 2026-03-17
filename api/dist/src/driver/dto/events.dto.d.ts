import { EventType } from '@prisma/client';
export declare class CreateTripEventDto {
    eventType: EventType;
    eventTime: string;
    stopId?: string;
    gpsLat?: number;
    gpsLng?: number;
    gpsAccuracy?: number;
    capturedOffline?: boolean;
    mediaFileKeys: string[];
}
