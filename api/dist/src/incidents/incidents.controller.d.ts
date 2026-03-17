import { IncidentsService } from './incidents.service';
import { GetIncidentsQueryDto, CreateIncidentDto, AddIncidentUpdateDto, ResolveIncidentDto, AddIncidentMediaDto } from './dto';
export declare class IncidentsController {
    private readonly service;
    constructor(service: IncidentsService);
    findAll(req: any, query: GetIncidentsQueryDto): Promise<({
        trip: {
            id: string;
            internalRef: string;
            runsheetDate: Date;
        };
        reporter: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    })[]>;
    create(req: any, dto: CreateIncidentDto): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
        reporter: {
            id: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    }>;
    findByTrip(req: any, tripId: string): Promise<({
        reporter: {
            id: string;
            firstName: string;
            lastName: string;
        };
        resolver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        media: {
            id: string;
            fileKey: string;
            incidentId: string;
            uploadedAt: Date;
        }[];
        updates: ({
            updater: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            newStatus: import(".prisma/client").$Enums.IncidentStatus | null;
            comment: string | null;
            updateAt: Date;
            incidentId: string;
            updatedByUserId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    })[]>;
    findOne(req: any, id: string): Promise<{
        trip: {
            id: string;
            tenantId: string;
            internalRef: string;
        };
        reporter: {
            id: string;
            firstName: string;
            lastName: string;
        };
        resolver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        replacementTrip: {
            id: string;
            internalRef: string;
        };
        media: {
            id: string;
            fileKey: string;
            incidentId: string;
            uploadedAt: Date;
        }[];
        updates: ({
            updater: {
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            newStatus: import(".prisma/client").$Enums.IncidentStatus | null;
            comment: string | null;
            updateAt: Date;
            incidentId: string;
            updatedByUserId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    }>;
    addUpdate(req: any, id: string, dto: AddIncidentUpdateDto): Promise<{
        updater: {
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        newStatus: import(".prisma/client").$Enums.IncidentStatus | null;
        comment: string | null;
        updateAt: Date;
        incidentId: string;
        updatedByUserId: string;
    }>;
    resolve(req: any, id: string, dto: ResolveIncidentDto): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
        resolver: {
            id: string;
            firstName: string;
            lastName: string;
        };
        replacementTrip: {
            id: string;
            internalRef: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    }>;
    close(req: any, id: string): Promise<{
        trip: {
            id: string;
            internalRef: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: import(".prisma/client").$Enums.IncidentStatus;
        description: string;
        severity: import(".prisma/client").$Enums.IncidentSeverity;
        tripId: string;
        incidentType: import(".prisma/client").$Enums.IncidentType;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        resolutionNotes: string | null;
        replacementTripId: string | null;
        reportedByUserId: string;
        reportedAt: Date;
        resolvedByUserId: string | null;
        resolvedAt: Date | null;
    }>;
    addMedia(req: any, id: string, dto: AddIncidentMediaDto): Promise<{
        id: string;
        fileKey: string;
        incidentId: string;
        uploadedAt: Date;
    }>;
}
