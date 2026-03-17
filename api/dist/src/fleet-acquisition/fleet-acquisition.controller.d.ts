import { FleetAcquisitionService } from './fleet-acquisition.service';
import { CreateOperatorDto, CreateDriverDto, CreateVehicleDto, UpdateOperatorInvoiceTypeDto } from './dto';
export declare class FleetAcquisitionController {
    private service;
    constructor(service: FleetAcquisitionService);
    createOperator(req: any, dto: CreateOperatorDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        tenantId: string;
        status: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        contactName: string | null;
        phone: string | null;
        address: string | null;
        taxId: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankBranch: string | null;
    }>;
    getOperators(req: any): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        tenantId: string;
        status: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        contactName: string | null;
        phone: string | null;
        address: string | null;
        taxId: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankBranch: string | null;
    }[]>;
    updateOperatorInvoiceType(req: any, id: string, dto: UpdateOperatorInvoiceTypeDto): Promise<{
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        email: string | null;
        tenantId: string;
        status: string;
        invoiceType: import(".prisma/client").$Enums.InvoiceType;
        contactName: string | null;
        phone: string | null;
        address: string | null;
        taxId: string | null;
        bankName: string | null;
        bankAccount: string | null;
        bankBranch: string | null;
    }>;
    createDriver(req: any, dto: CreateDriverDto): Promise<{
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
    }>;
    getDrivers(req: any): Promise<({
        assignments: ({
            operator: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                status: string;
                invoiceType: import(".prisma/client").$Enums.InvoiceType;
                contactName: string | null;
                phone: string | null;
                address: string | null;
                taxId: string | null;
                bankName: string | null;
                bankAccount: string | null;
                bankBranch: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            driverId: string;
            operatorId: string;
            startDate: Date;
            endDate: Date | null;
        })[];
    } & {
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
    })[]>;
    createVehicle(req: any, dto: CreateVehicleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        plateNumber: string;
        vehicleType: string;
        bodyType: string | null;
    }>;
    getVehicles(req: any): Promise<({
        assignments: ({
            operator: {
                id: string;
                name: string;
                createdAt: Date;
                updatedAt: Date;
                email: string | null;
                tenantId: string;
                status: string;
                invoiceType: import(".prisma/client").$Enums.InvoiceType;
                contactName: string | null;
                phone: string | null;
                address: string | null;
                taxId: string | null;
                bankName: string | null;
                bankAccount: string | null;
                bankBranch: string | null;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            operatorId: string;
            startDate: Date;
            endDate: Date | null;
            vehicleId: string;
        })[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        plateNumber: string;
        vehicleType: string;
        bodyType: string | null;
    })[]>;
}
