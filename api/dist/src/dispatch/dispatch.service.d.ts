import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { PODStatus, AssignmentStatus, EventType, HighLevelTripStatus, IncidentSeverity, IncidentStatus } from '@prisma/client';
import { CreateTripDto, VerifyPODDto, RejectPODDto } from './dto';
import { NotificationsService } from '../notifications/notifications.service';
import { IncidentsService } from '../incidents/incidents.service';
import { BarcodeCoverService } from '../barcode-cover/barcode-cover.service';
import { RatesService } from '../rates/rates.service';
export declare class DispatchService {
    private prisma;
    private audit;
    private notifications;
    private incidents;
    private barcodeCover;
    private ratesService;
    constructor(prisma: PrismaService, audit: AuditService, notifications: NotificationsService, incidents: IncidentsService, barcodeCover: BarcodeCoverService, ratesService: RatesService);
    getLookups(tenantId: string): Promise<{
        clients: {
            id: string;
            name: string;
            code: string;
            serviceCategories: {
                id: string;
                name: string;
                code: string;
            }[];
        }[];
        drivers: {
            id: string;
            firstName: string;
            lastName: string;
            assignments: {
                operatorId: string;
                operator: {
                    id: string;
                    name: string;
                };
            }[];
        }[];
        vehicles: {
            id: string;
            plateNumber: string;
            vehicleType: string;
            bodyType: string;
            assignments: {
                operatorId: string;
                operator: {
                    id: string;
                    name: string;
                };
            }[];
        }[];
        operators: {
            id: string;
            name: string;
        }[];
        tripFieldOptions: {
            originAreas: string[];
            destinationAreas: string[];
            vehicleTypes: string[];
        };
    }>;
    createTrip(userId: string, tenantId: string, dto: CreateTripDto): Promise<{
        trip: {
            serviceCategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                code: string;
                clientAccountId: string;
                segmentType: string;
            };
            assignedDriver: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                firstName: string;
                lastName: string;
                status: string;
                phone: string | null;
                spxDriverId: string | null;
                licenseNumber: string | null;
            };
            assignedVehicle: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: string;
                plateNumber: string;
                vehicleType: string;
                bodyType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            clientAccountId: string;
            segmentType: string;
            serviceCategoryId: string;
            vehicleType: string;
            internalRef: string;
            externalRef: string | null;
            requestDeliveryDate: Date | null;
            runsheetDate: Date;
            abStatus: string | null;
            originArea: string;
            destinationArea: string;
            routeCode: string | null;
            tripOrder: number | null;
            callTime: Date;
            assignedDriverId: string | null;
            assignedVehicleId: string | null;
            operatorIdAtAssignment: string | null;
            assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
            assignedAt: Date | null;
            acceptedAt: Date | null;
            declinedAt: Date | null;
            declineReason: string | null;
            lastDriverEventAt: Date | null;
            highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
            podStatus: import(".prisma/client").$Enums.PODStatus;
            podLastReviewedByUserId: string | null;
            podLastReviewedAt: Date | null;
            podRejectionComment: string | null;
            createdByUserId: string;
            clientTripRef: string | null;
        };
        rateExpiryWarning: boolean;
    }>;
    getTrips(tenantId: string, query?: {
        dateFrom?: string;
        dateTo?: string;
        assignmentStatus?: AssignmentStatus;
        highLevelTripStatus?: HighLevelTripStatus;
        podStatus?: PODStatus;
        clientAccountId?: string;
        internalRef?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        items: ({
            clientAccount: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: string;
                code: string;
            };
            serviceCategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                code: string;
                clientAccountId: string;
                segmentType: string;
            };
            assignedDriver: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                firstName: string;
                lastName: string;
                status: string;
                phone: string | null;
                spxDriverId: string | null;
                licenseNumber: string | null;
            };
            assignedVehicle: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: string;
                plateNumber: string;
                vehicleType: string;
                bodyType: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            clientAccountId: string;
            segmentType: string;
            serviceCategoryId: string;
            vehicleType: string;
            internalRef: string;
            externalRef: string | null;
            requestDeliveryDate: Date | null;
            runsheetDate: Date;
            abStatus: string | null;
            originArea: string;
            destinationArea: string;
            routeCode: string | null;
            tripOrder: number | null;
            callTime: Date;
            assignedDriverId: string | null;
            assignedVehicleId: string | null;
            operatorIdAtAssignment: string | null;
            assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
            assignedAt: Date | null;
            acceptedAt: Date | null;
            declinedAt: Date | null;
            declineReason: string | null;
            lastDriverEventAt: Date | null;
            highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
            podStatus: import(".prisma/client").$Enums.PODStatus;
            podLastReviewedByUserId: string | null;
            podLastReviewedAt: Date | null;
            podRejectionComment: string | null;
            createdByUserId: string;
            clientTripRef: string | null;
        })[];
        totalCount: number;
    }>;
    getTripById(tenantId: string, tripId: string): Promise<{
        clientAccount: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            code: string;
        };
        serviceCategory: {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            status: string;
            code: string;
            clientAccountId: string;
            segmentType: string;
        };
        documents: {
            id: string;
            tripId: string;
            fileKey: string;
            uploadedAt: Date;
            docType: import(".prisma/client").$Enums.DocumentType;
            uploadedByUserId: string | null;
        }[];
        assignedDriver: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            email: string | null;
            tenantId: string;
            firstName: string;
            lastName: string;
            status: string;
            phone: string | null;
            spxDriverId: string | null;
            licenseNumber: string | null;
        };
        assignedVehicle: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tenantId: string;
            status: string;
            plateNumber: string;
            vehicleType: string;
            bodyType: string | null;
        };
        stops: ({
            events: ({
                media: {
                    id: string;
                    fileKey: string;
                    uploadedAt: Date;
                    tripEventId: string;
                }[];
            } & {
                id: string;
                createdAt: Date;
                tripId: string;
                gpsLat: number | null;
                gpsLng: number | null;
                gpsAccuracy: number | null;
                createdByUserId: string | null;
                eventTime: Date;
                stopId: string | null;
                eventType: import(".prisma/client").$Enums.EventType;
                capturedOffline: boolean;
            })[];
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tripId: string;
            stopSequence: number;
            stopType: import(".prisma/client").$Enums.StopType;
            locationName: string;
            plannedArrival: Date | null;
        })[];
        incidents: {
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
        }[];
        finance: {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            tripId: string;
            financeDocReceivedAt: Date | null;
            clientBillAmount: import("@prisma/client/runtime/library").Decimal | null;
            vatableBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            nonVatBaseRate: import("@prisma/client/runtime/library").Decimal | null;
            payoutBase: import("@prisma/client/runtime/library").Decimal | null;
            adminFee: import("@prisma/client/runtime/library").Decimal | null;
            netTripPayoutBeforeReimb: import("@prisma/client/runtime/library").Decimal | null;
            tollAmount: import("@prisma/client/runtime/library").Decimal | null;
            gasAmount: import("@prisma/client/runtime/library").Decimal | null;
            parkingAmount: import("@prisma/client/runtime/library").Decimal | null;
            reimbursableStatus: import(".prisma/client").$Enums.ReimbursableStatus | null;
            approvedReimbursableAmount: import("@prisma/client/runtime/library").Decimal | null;
            billingStatus: import(".prisma/client").$Enums.BillingStatus | null;
            billingLedgerDate: Date | null;
            payoutStatus: import(".prisma/client").$Enums.PayoutStatus | null;
            payoutLedgerDate: Date | null;
            payoutDueDate: Date | null;
            overrideExpiredDeadline: boolean;
            overrideRequestId: string | null;
            billingDispute: boolean;
            billingDisputeReason: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    verifyPOD(userId: string, tenantId: string, tripId: string, dto: VerifyPODDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    rejectPOD(userId: string, tenantId: string, tripId: string, dto: RejectPODDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    proxyCreateTripEvent(params: {
        userId: string;
        tenantId: string;
        tripId: string;
        dto: {
            reason: string;
            eventType: EventType;
            eventTime: string;
            stopId?: string;
            gpsLat?: number;
            gpsLng?: number;
            gpsAccuracy?: number;
            capturedOffline?: boolean;
            mediaFileKeys: string[];
        };
    }): Promise<{
        media: {
            id: string;
            fileKey: string;
            uploadedAt: Date;
            tripEventId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        tripId: string;
        gpsLat: number | null;
        gpsLng: number | null;
        gpsAccuracy: number | null;
        createdByUserId: string | null;
        eventTime: Date;
        stopId: string | null;
        eventType: import(".prisma/client").$Enums.EventType;
        capturedOffline: boolean;
    }>;
    proxyUploadPod(params: {
        userId: string;
        tenantId: string;
        tripId: string;
        dto: {
            reason: string;
            fileKey: string;
        };
    }): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        segmentType: string;
        serviceCategoryId: string;
        vehicleType: string;
        internalRef: string;
        externalRef: string | null;
        requestDeliveryDate: Date | null;
        runsheetDate: Date;
        abStatus: string | null;
        originArea: string;
        destinationArea: string;
        routeCode: string | null;
        tripOrder: number | null;
        callTime: Date;
        assignedDriverId: string | null;
        assignedVehicleId: string | null;
        operatorIdAtAssignment: string | null;
        assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
        assignedAt: Date | null;
        acceptedAt: Date | null;
        declinedAt: Date | null;
        declineReason: string | null;
        lastDriverEventAt: Date | null;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        podStatus: import(".prisma/client").$Enums.PODStatus;
        podLastReviewedByUserId: string | null;
        podLastReviewedAt: Date | null;
        podRejectionComment: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    proxyUploadReimbursableDoc(params: {
        userId: string;
        tenantId: string;
        tripId: string;
        dto: {
            reason: string;
            docType: 'TOLL' | 'GAS' | 'PARKING';
            fileKey: string;
        };
    }): Promise<{
        id: string;
        tripId: string;
        fileKey: string;
        uploadedAt: Date;
        docType: import(".prisma/client").$Enums.DocumentType;
        uploadedByUserId: string | null;
    }>;
    proxyCreateIncident(params: {
        userId: string;
        tenantId: string;
        tripId: string;
        dto: {
            reason: string;
            incidentType: any;
            severity: any;
            description: string;
            gpsLat?: number;
            gpsLng?: number;
            gpsAccuracy?: number;
        };
    }): Promise<{
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
    proxyIncidentUpdate(params: {
        userId: string;
        tenantId: string;
        incidentId: string;
        dto: {
            reason: string;
            newStatus?: any;
            comment?: string;
        };
    }): Promise<{
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
    proxyIncidentResolve(params: {
        userId: string;
        tenantId: string;
        incidentId: string;
        dto: {
            reason: string;
            resolutionNotes: string;
            replacementTripId?: string;
        };
    }): Promise<{
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
    getDriverAvailability(tenantId: string, query: {
        date?: string;
        from?: string;
        to?: string;
        status?: any;
        codingDay?: any;
    }): Promise<({
        driver: {
            id: string;
            firstName: string;
            lastName: string;
            status: string;
            phone: string;
            spxDriverId: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        driverId: string;
        tenantId: string;
        status: import(".prisma/client").$Enums.DriverAvailabilityStatus;
        date: Date;
        codingDay: boolean;
        note: string | null;
    })[]>;
    search(tenantId: string, q: string): Promise<{
        trips: {
            id: string;
            internalRef: string;
            runsheetDate: Date;
        }[];
        drivers: {
            id: string;
            firstName: string;
            lastName: string;
        }[];
        operators: {
            id: string;
            name: string;
        }[];
    }>;
    getOperationsDashboard(tenantId: string, query: {
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
    }): Promise<{
        counts: {
            pendingAcceptance: number;
            acceptedOngoing: number;
            completed: number;
            podUploadedPendingReview: number;
            podRejected: number;
            podVerified: number;
            financeDocReceived: number;
            noUpdateCallTime: number;
        };
        pendingAcceptanceTrips: {
            id: string;
            serviceCategory: {
                id: string;
                name: string;
                code: string;
            };
            internalRef: string;
            runsheetDate: Date;
            callTime: Date;
            assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
            lastDriverEventAt: Date;
            highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
            podStatus: import(".prisma/client").$Enums.PODStatus;
            assignedDriver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        }[];
        noUpdateCallTimeTrips: {
            id: string;
            serviceCategory: {
                id: string;
                name: string;
                code: string;
            };
            internalRef: string;
            runsheetDate: Date;
            callTime: Date;
            assignmentStatus: import(".prisma/client").$Enums.AssignmentStatus;
            lastDriverEventAt: Date;
            highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
            podStatus: import(".prisma/client").$Enums.PODStatus;
            assignedDriver: {
                id: string;
                firstName: string;
                lastName: string;
            };
        }[];
        openIncidents: {
            id: string;
            status: import(".prisma/client").$Enums.IncidentStatus;
            trip: {
                id: string;
                internalRef: string;
            };
            description: string;
            severity: import(".prisma/client").$Enums.IncidentSeverity;
            tripId: string;
            incidentType: import(".prisma/client").$Enums.IncidentType;
            reportedAt: Date;
        }[];
    }>;
}
