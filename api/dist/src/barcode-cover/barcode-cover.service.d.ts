import { ConfigService } from '@nestjs/config';
export interface TripForBarcode {
    id: string;
    internalRef: string;
    runsheetDate: Date;
    requestDeliveryDate: Date | null;
    originArea: string;
    destinationArea: string;
    externalRef: string | null;
    clientAccount?: {
        name: string;
        code: string;
    } | null;
    serviceCategory?: {
        name: string;
        code: string;
    } | null;
    assignedDriver?: {
        firstName: string;
        lastName: string;
    } | null;
    assignedVehicle?: {
        plateNumber: string;
    } | null;
}
export declare class BarcodeCoverService {
    private config;
    constructor(config: ConfigService);
    generateAndSave(trip: TripForBarcode): Promise<{
        fileKey: string;
    }>;
    private generatePdf;
}
