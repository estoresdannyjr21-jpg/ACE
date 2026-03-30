import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { CreateRouteRateDto, UpdateRouteRateDto, GetRouteRatesQueryDto, CreateWetleaseFirstTripRateDto, UpdateWetleaseFirstTripRateDto } from './dto';
import { Prisma } from '@prisma/client';
export declare const WETLEASE_CATEGORY_CODES: ReadonlySet<string>;
export declare function utcCalendarDayBounds(d: Date): {
    dayStart: Date;
    dayEnd: Date;
};
export declare class RatesService {
    private prisma;
    private audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private readonly SEGMENT_TO_CATEGORY_CODES;
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
    }>;
    createRouteRate(userId: string, tenantId: string, dto: CreateRouteRateDto): Promise<{
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
        billRateAmount: Prisma.Decimal;
        tripPayoutRateVatable: Prisma.Decimal;
    }>;
    getRouteRates(tenantId: string, query: GetRouteRatesQueryDto): Promise<({
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
        billRateAmount: Prisma.Decimal;
        tripPayoutRateVatable: Prisma.Decimal;
    })[]>;
    getRouteRateById(tenantId: string, id: string): Promise<{
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
        billRateAmount: Prisma.Decimal;
        tripPayoutRateVatable: Prisma.Decimal;
    }>;
    updateRouteRate(tenantId: string, id: string, dto: UpdateRouteRateDto): Promise<{
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
        billRateAmount: Prisma.Decimal;
        tripPayoutRateVatable: Prisma.Decimal;
    }>;
    deleteRouteRate(tenantId: string, id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
    getActiveRateForTrip(tenantId: string, clientAccountId: string, serviceCategoryId: string, originArea: string, destinationArea: string, asOfDate: Date): Promise<{
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
        billRateAmount: Prisma.Decimal;
        tripPayoutRateVatable: Prisma.Decimal;
    }>;
    isWetleaseCategoryCode(code: string | null | undefined): boolean;
    resolveWetleaseFirstTripPayoutAmount(tenantId: string, clientAccountId: string, serviceCategoryId: string, asOfDate: Date): Promise<number>;
    resolveWetleaseFirstTripClientBillAmount(tenantId: string, clientAccountId: string, serviceCategoryId: string, asOfDate: Date): Promise<number>;
    listWetleaseFirstTripRates(tenantId: string, query: {
        clientAccountId?: string;
        serviceCategoryId?: string;
    }): Promise<({
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
        firstTripClientBillAmount: Prisma.Decimal | null;
        firstTripPayoutVatable: Prisma.Decimal;
        effectiveStart: Date;
        effectiveEnd: Date | null;
    })[]>;
    createWetleaseFirstTripRate(userId: string, tenantId: string, dto: CreateWetleaseFirstTripRateDto): Promise<{
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
        firstTripClientBillAmount: Prisma.Decimal | null;
        firstTripPayoutVatable: Prisma.Decimal;
        effectiveStart: Date;
        effectiveEnd: Date | null;
    }>;
    updateWetleaseFirstTripRate(tenantId: string, id: string, dto: UpdateWetleaseFirstTripRateDto): Promise<{
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
        firstTripClientBillAmount: Prisma.Decimal | null;
        firstTripPayoutVatable: Prisma.Decimal;
        effectiveStart: Date;
        effectiveEnd: Date | null;
    }>;
    private assertWetleaseCategoryOrThrow;
    private validateClientAndCategory;
    importRatesFromCsv(params: {
        userId: string;
        tenantId: string;
        csvBuffer: Buffer;
        commit: boolean;
        mode: 'create' | 'update' | 'upsert';
    }): Promise<{
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
