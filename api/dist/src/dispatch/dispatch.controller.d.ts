import { DispatchService } from './dispatch.service';
import { CreateTripDto, VerifyPODDto, RejectPODDto, GetTripsQueryDto } from './dto';
import { DriverAvailabilityQueryDto } from './dto/availability-query.dto';
import { OperationsDashboardQueryDto } from './dto/operations-dashboard.dto';
import { ProxyCreateIncidentDto, ProxyIncidentResolveDto, ProxyIncidentUpdateDto, ProxyPodUploadDto, ProxyReimbursableDocDto, ProxyTripEventDto } from './dto/proxy-update.dto';
import { ForceCompleteTripDto, FulfillTripRequirementsDto } from '../trip-requirements/dto';
export declare class DispatchController {
    private service;
    constructor(service: DispatchService);
    search(req: any, q?: string): Promise<{
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
    lookups(req: any): Promise<{
        clients: {
            id: string;
            name: string;
            code: string;
            serviceSegments: {
                id: string;
                name: string;
                code: string;
            }[];
            serviceCategories: {
                id: string;
                name: string;
                code: string;
                serviceSegment: {
                    id: string;
                    name: string;
                    code: string;
                };
                serviceSegmentId: string;
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
    createTrip(req: any, dto: CreateTripDto): Promise<{
        trip: {
            serviceCategory: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                status: string;
                code: string;
                clientAccountId: string;
                serviceSegmentId: string;
                payoutTermsBusinessDays: number;
                docSubmissionDay: string;
                cycleStartDay: string;
                excludeWeekends: boolean;
                subcontractorInvoiceDeadlineDays: number;
                callTimeGraceMinutes: number;
                vatRate: import("@prisma/client/runtime/library").Decimal;
                adminFeePercent: import("@prisma/client/runtime/library").Decimal;
                withholdingPercent: import("@prisma/client/runtime/library").Decimal;
                firstTripOnlyPayout: boolean;
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
            serviceCategoryId: string;
            vehicleType: string;
            segmentType: string;
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
            completedAt: Date | null;
            completedByUserId: string | null;
            completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
            forceCompletedReason: string | null;
            createdByUserId: string;
            clientTripRef: string | null;
        };
        rateExpiryWarning: boolean;
    }>;
    getTrips(req: any, query: GetTripsQueryDto): Promise<{
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
                serviceSegmentId: string;
                payoutTermsBusinessDays: number;
                docSubmissionDay: string;
                cycleStartDay: string;
                excludeWeekends: boolean;
                subcontractorInvoiceDeadlineDays: number;
                callTimeGraceMinutes: number;
                vatRate: import("@prisma/client/runtime/library").Decimal;
                adminFeePercent: import("@prisma/client/runtime/library").Decimal;
                withholdingPercent: import("@prisma/client/runtime/library").Decimal;
                firstTripOnlyPayout: boolean;
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
            serviceCategoryId: string;
            vehicleType: string;
            segmentType: string;
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
            completedAt: Date | null;
            completedByUserId: string | null;
            completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
            forceCompletedReason: string | null;
            createdByUserId: string;
            clientTripRef: string | null;
        })[];
        totalCount: number;
    }>;
    getDriverAvailability(req: any, query: DriverAvailabilityQueryDto): Promise<({
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
    getOperationsDashboard(req: any, query: OperationsDashboardQueryDto): Promise<{
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
    getTripById(req: any, tripId: string): Promise<{
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
            serviceSegmentId: string;
            payoutTermsBusinessDays: number;
            docSubmissionDay: string;
            cycleStartDay: string;
            excludeWeekends: boolean;
            subcontractorInvoiceDeadlineDays: number;
            callTimeGraceMinutes: number;
            vatRate: import("@prisma/client/runtime/library").Decimal;
            adminFeePercent: import("@prisma/client/runtime/library").Decimal;
            withholdingPercent: import("@prisma/client/runtime/library").Decimal;
            firstTripOnlyPayout: boolean;
        };
        documents: {
            id: string;
            docType: import(".prisma/client").$Enums.DocumentType;
            fileKey: string;
            tripId: string;
            uploadedAt: Date;
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
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    getTripRequirements(req: any, tripId: string): Promise<{
        tripId: string;
        internalRef: string;
        clientAccountId: string;
        serviceCategoryCode: string;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        completedAt: Date;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource;
        requirements: {
            id: string;
            code: string;
            label: string;
            kind: import(".prisma/client").$Enums.TripRequirementKind;
            docType: import(".prisma/client").$Enums.DocumentType;
            required: boolean;
            helpText: string;
            fulfilled: boolean;
            value: string;
            fileKey: string;
            fulfilledAt: Date;
            fulfilledBy: string;
            source: import(".prisma/client").$Enums.TripCompletionSource;
        }[];
        missing: {
            code: string;
            label: string;
            kind: import(".prisma/client").$Enums.TripRequirementKind;
        }[];
        canComplete: boolean;
    }>;
    fulfillTripRequirements(req: any, tripId: string, dto: FulfillTripRequirementsDto): Promise<{
        tripId: string;
        internalRef: string;
        clientAccountId: string;
        serviceCategoryCode: string;
        highLevelTripStatus: import(".prisma/client").$Enums.HighLevelTripStatus;
        completedAt: Date;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource;
        requirements: {
            id: string;
            code: string;
            label: string;
            kind: import(".prisma/client").$Enums.TripRequirementKind;
            docType: import(".prisma/client").$Enums.DocumentType;
            required: boolean;
            helpText: string;
            fulfilled: boolean;
            value: string;
            fileKey: string;
            fulfilledAt: Date;
            fulfilledBy: string;
            source: import(".prisma/client").$Enums.TripCompletionSource;
        }[];
        missing: {
            code: string;
            label: string;
            kind: import(".prisma/client").$Enums.TripRequirementKind;
        }[];
        canComplete: boolean;
    }>;
    completeTrip(req: any, tripId: string): Promise<{
        requirementFulfillments: ({
            requirement: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: string;
                code: string;
                clientAccountId: string;
                sortOrder: number;
                serviceCategoryId: string | null;
                label: string;
                kind: import(".prisma/client").$Enums.TripRequirementKind;
                docType: import(".prisma/client").$Enums.DocumentType | null;
                required: boolean;
                helpText: string | null;
            };
        } & {
            id: string;
            updatedAt: Date;
            fileKey: string | null;
            tripId: string;
            requirementId: string;
            value: string | null;
            source: import(".prisma/client").$Enums.TripCompletionSource;
            fulfilledByUserId: string;
            fulfilledAt: Date;
        })[];
        serviceCategory: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    forceCompleteTrip(req: any, tripId: string, dto: ForceCompleteTripDto): Promise<{
        requirementFulfillments: ({
            requirement: {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                tenantId: string;
                status: string;
                code: string;
                clientAccountId: string;
                sortOrder: number;
                serviceCategoryId: string | null;
                label: string;
                kind: import(".prisma/client").$Enums.TripRequirementKind;
                docType: import(".prisma/client").$Enums.DocumentType | null;
                required: boolean;
                helpText: string | null;
            };
        } & {
            id: string;
            updatedAt: Date;
            fileKey: string | null;
            tripId: string;
            requirementId: string;
            value: string | null;
            source: import(".prisma/client").$Enums.TripCompletionSource;
            fulfilledByUserId: string;
            fulfilledAt: Date;
        })[];
        serviceCategory: {
            id: string;
            name: string;
            code: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    verifyPOD(req: any, tripId: string, dto: VerifyPODDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    rejectPOD(req: any, tripId: string, dto: RejectPODDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    proxyTripEvent(req: any, tripId: string, dto: ProxyTripEventDto): Promise<{
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
    proxyPodUpload(req: any, tripId: string, dto: ProxyPodUploadDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        clientAccountId: string;
        serviceCategoryId: string;
        vehicleType: string;
        segmentType: string;
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
        completedAt: Date | null;
        completedByUserId: string | null;
        completionSource: import(".prisma/client").$Enums.TripCompletionSource | null;
        forceCompletedReason: string | null;
        createdByUserId: string;
        clientTripRef: string | null;
    }>;
    proxyReimbursableDoc(req: any, tripId: string, dto: ProxyReimbursableDocDto): Promise<{
        id: string;
        docType: import(".prisma/client").$Enums.DocumentType;
        fileKey: string;
        tripId: string;
        uploadedAt: Date;
        uploadedByUserId: string | null;
    }>;
    proxyCreateIncident(req: any, tripId: string, dto: ProxyCreateIncidentDto): Promise<{
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
    proxyIncidentUpdate(req: any, incidentId: string, dto: ProxyIncidentUpdateDto): Promise<{
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
    proxyIncidentResolve(req: any, incidentId: string, dto: ProxyIncidentResolveDto): Promise<{
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
}
