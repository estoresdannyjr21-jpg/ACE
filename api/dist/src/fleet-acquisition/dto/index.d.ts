import { InvoiceType } from '@prisma/client';
export declare class UpdateOperatorInvoiceTypeDto {
    invoiceType: InvoiceType;
}
export declare class CreateOperatorDto {
    name: string;
    contactName?: string;
    email?: string;
    phone?: string;
    address?: string;
    taxId?: string;
    invoiceType?: InvoiceType;
    bankName?: string;
    bankAccount?: string;
    bankBranch?: string;
}
export declare class CreateDriverDto {
    spxDriverId?: string;
    firstName: string;
    lastName: string;
    phone?: string;
    email?: string;
    licenseNumber?: string;
    operatorId?: string;
    assignmentStartDate?: string;
}
export declare class CreateVehicleDto {
    plateNumber: string;
    vehicleType: string;
    bodyType?: string;
    operatorId?: string;
    assignmentStartDate?: string;
}
