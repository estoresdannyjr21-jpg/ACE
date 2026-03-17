"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetInventoryService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let FleetInventoryService = class FleetInventoryService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(tenantId, dto) {
        const client = await this.prisma.clientAccount.findFirst({
            where: { id: dto.clientAccountId, tenantId },
        });
        if (!client) {
            throw new common_1.NotFoundException('Client account not found');
        }
        const vehicle = await this.prisma.vehicle.findFirst({
            where: { id: dto.vehicleId, tenantId },
        });
        if (!vehicle) {
            throw new common_1.NotFoundException('Vehicle not found');
        }
        const effectiveStart = new Date(dto.effectiveStart);
        const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
        if (effectiveEnd && effectiveEnd <= effectiveStart) {
            throw new common_1.BadRequestException('effectiveEnd must be after effectiveStart');
        }
        return this.prisma.fleetInventory.create({
            data: {
                clientAccountId: dto.clientAccountId,
                vehicleId: dto.vehicleId,
                tagType: dto.tagType,
                effectiveStart,
                effectiveEnd,
            },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
            },
        });
    }
    async findMany(tenantId, query) {
        const effectiveOn = query.effectiveOn ? new Date(query.effectiveOn) : null;
        const where = {
            clientAccount: { tenantId },
            ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
            ...(query.vehicleId && { vehicleId: query.vehicleId }),
            ...(effectiveOn && {
                effectiveStart: { lte: effectiveOn },
                OR: [
                    { effectiveEnd: null },
                    { effectiveEnd: { gte: effectiveOn } },
                ],
            }),
        };
        return this.prisma.fleetInventory.findMany({
            where,
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
            },
            orderBy: [{ effectiveStart: 'desc' }, { createdAt: 'desc' }],
        });
    }
    async findOne(tenantId, id) {
        const entry = await this.prisma.fleetInventory.findFirst({
            where: { id, clientAccount: { tenantId } },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
            },
        });
        if (!entry) {
            throw new common_1.NotFoundException('Fleet inventory entry not found');
        }
        return entry;
    }
    async update(tenantId, id, dto) {
        await this.findOne(tenantId, id);
        return this.prisma.fleetInventory.update({
            where: { id },
            data: {
                ...(dto.effectiveEnd !== undefined && {
                    effectiveEnd: dto.effectiveEnd ? new Date(dto.effectiveEnd) : null,
                }),
                ...(dto.status !== undefined && { status: dto.status }),
            },
            include: {
                clientAccount: { select: { id: true, name: true } },
                vehicle: { select: { id: true, plateNumber: true } },
            },
        });
    }
    async remove(tenantId, id) {
        await this.findOne(tenantId, id);
        await this.prisma.fleetInventory.delete({ where: { id } });
        return { deleted: true, id };
    }
};
exports.FleetInventoryService = FleetInventoryService;
exports.FleetInventoryService = FleetInventoryService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FleetInventoryService);
//# sourceMappingURL=fleet-inventory.service.js.map