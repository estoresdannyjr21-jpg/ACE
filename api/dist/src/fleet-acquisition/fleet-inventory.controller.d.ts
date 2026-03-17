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
        vehicleId: string;
        tagType: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
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
        vehicleId: string;
        tagType: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
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
        vehicleId: string;
        tagType: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
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
        vehicleId: string;
        tagType: string;
        effectiveStart: Date;
        effectiveEnd: Date | null;
    }>;
    remove(req: any, id: string): Promise<{
        deleted: boolean;
        id: string;
    }>;
}
