import { FleetInventoryService } from './fleet-inventory.service';
import { CreateFleetInventoryDto, UpdateFleetInventoryDto, GetFleetInventoryQueryDto } from './dto/fleet-inventory.dto';
export declare class FleetInventoryController {
    private readonly service;
    constructor(service: FleetInventoryService);
    create(req: any, dto: CreateFleetInventoryDto): Promise<{
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
    findMany(req: any, query: GetFleetInventoryQueryDto): Promise<({
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
    findOne(req: any, id: string): Promise<{
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
    update(req: any, id: string, dto: UpdateFleetInventoryDto): Promise<{
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
    remove(req: any, id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
