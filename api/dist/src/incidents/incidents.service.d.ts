import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { IncidentStatus, IncidentSeverity } from '@prisma/client';
import { CreateIncidentDto, AddIncidentUpdateDto, ResolveIncidentDto, AddIncidentMediaDto } from './dto';
export declare class IncidentsService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    findMany(tenantId: string, query: {
        status?: IncidentStatus;
        severity?: IncidentSeverity;
        tripId?: string;
        dateFrom?: string;
        dateTo?: string;
    }): Promise<({
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
    create(userId: string, tenantId: string, dto: CreateIncidentDto): Promise<{
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
    findByTrip(tenantId: string, tripId: string): Promise<({
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
    findOne(tenantId: string, incidentId: string): Promise<{
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
    addUpdate(userId: string, tenantId: string, incidentId: string, dto: AddIncidentUpdateDto): Promise<{
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
    resolve(userId: string, tenantId: string, incidentId: string, dto: ResolveIncidentDto): Promise<{
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
    close(tenantId: string, incidentId: string): Promise<{
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
    addMedia(tenantId: string, incidentId: string, dto: AddIncidentMediaDto): Promise<{
        id: string;
        fileKey: string;
        incidentId: string;
        uploadedAt: Date;
    }>;
    private getIncidentForTenant;
}
