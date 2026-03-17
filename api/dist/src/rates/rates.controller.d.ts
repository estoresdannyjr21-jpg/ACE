import { RatesService } from './rates.service';
import { CreateRouteRateDto, UpdateRouteRateDto, GetRouteRatesQueryDto } from './dto';
export declare class RatesController {
    private readonly service;
    constructor(service: RatesService);
    create(req: any, dto: CreateRouteRateDto): Promise<{
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
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
        effectiveStart: Date;
        effectiveEnd: Date | null;
        originArea: string;
        destinationArea: string;
        billRateAmount: import("@prisma/client/runtime/library").Decimal;
        tripPayoutRateVatable: import("@prisma/client/runtime/library").Decimal;
    }>;
    findAll(req: any, query: GetRouteRatesQueryDto): Promise<({
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
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
        effectiveStart: Date;
        effectiveEnd: Date | null;
        originArea: string;
        destinationArea: string;
        billRateAmount: import("@prisma/client/runtime/library").Decimal;
        tripPayoutRateVatable: import("@prisma/client/runtime/library").Decimal;
    })[]>;
    lookups(req: any): Promise<{
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
    }>;
    findOne(req: any, id: string): Promise<{
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
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
        effectiveStart: Date;
        effectiveEnd: Date | null;
        originArea: string;
        destinationArea: string;
        billRateAmount: import("@prisma/client/runtime/library").Decimal;
        tripPayoutRateVatable: import("@prisma/client/runtime/library").Decimal;
    }>;
    update(req: any, id: string, dto: UpdateRouteRateDto): Promise<{
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
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
        effectiveStart: Date;
        effectiveEnd: Date | null;
        originArea: string;
        destinationArea: string;
        billRateAmount: import("@prisma/client/runtime/library").Decimal;
        tripPayoutRateVatable: import("@prisma/client/runtime/library").Decimal;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    importRatesCsv(req: any, file: Express.Multer.File, commit?: string, mode?: string): Promise<{
        mode: string;
        importMode: "create" | "update" | "upsert";
        totalRows: number;
        validRows: number;
        created: number;
        updated: number;
        errors: {
            rowNumber: number;
            message: string;
        }[];
    }>;
}
