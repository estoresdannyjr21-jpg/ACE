import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceType } from '@prisma/client';
import { CreateOperatorDto, CreateDriverDto, CreateVehicleDto } from './dto';
export declare class FleetAcquisitionService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    createOperator(userId: string, tenantId: string, dto: CreateOperatorDto): Promise<{
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
    private maskOperatorBankDetails;
    getOperators(tenantId: string, options?: {
        maskBankDetails?: boolean;
    }): Promise<{
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
    updateOperatorInvoiceType(userId: string, tenantId: string, operatorId: string, invoiceType: InvoiceType): Promise<{
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
    createDriver(userId: string, tenantId: string, dto: CreateDriverDto): Promise<{
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
    getDrivers(tenantId: string): Promise<({
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
    createVehicle(userId: string, tenantId: string, dto: CreateVehicleDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        tenantId: string;
        status: string;
        plateNumber: string;
        vehicleType: string;
        bodyType: string | null;
    }>;
    getVehicles(tenantId: string): Promise<({
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
