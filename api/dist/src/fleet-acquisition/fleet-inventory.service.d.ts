import { PrismaService } from '../common/prisma/prisma.service';
import { CreateFleetInventoryDto, UpdateFleetInventoryDto, GetFleetInventoryQueryDto } from './dto/fleet-inventory.dto';
export declare class FleetInventoryService {
    private prisma;
    constructor(prisma: PrismaService);
    create(tenantId: string, dto: CreateFleetInventoryDto): Promise<{
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            plateNumber: string;
            vehicleType: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clientAccountId: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
        vehicleId: string;
        tagType: string;
    }>;
    findMany(tenantId: string, query: GetFleetInventoryQueryDto): Promise<({
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            plateNumber: string;
            vehicleType: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clientAccountId: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
        vehicleId: string;
        tagType: string;
    })[]>;
    findOne(tenantId: string, id: string): Promise<{
        clientAccount: {
            id: string;
            name: string;
            code: string;
        };
        vehicle: {
            id: string;
            plateNumber: string;
            vehicleType: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clientAccountId: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
        vehicleId: string;
        tagType: string;
    }>;
    update(tenantId: string, id: string, dto: UpdateFleetInventoryDto): Promise<{
        clientAccount: {
            id: string;
            name: string;
        };
        vehicle: {
            id: string;
            plateNumber: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        status: string;
        clientAccountId: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
        vehicleId: string;
        tagType: string;
    }>;
    remove(tenantId: string, id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
