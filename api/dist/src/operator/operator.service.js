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
exports.OperatorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
let OperatorService = class OperatorService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getTrips(tenantId, operatorId, query) {
        if (!operatorId) {
            throw new common_1.ForbiddenException('Operator user is not linked to an operator');
        }
        const where = {
            tenantId,
            operatorIdAtAssignment: operatorId,
            ...(query?.from && query?.to
                ? { runsheetDate: { gte: new Date(query.from), lte: new Date(query.to) } }
                : {}),
        };
        return this.prisma.trip.findMany({
            where,
            include: {
                serviceCategory: true,
                assignedDriver: true,
                assignedVehicle: true,
                finance: true,
            },
            orderBy: { runsheetDate: 'desc' },
            take: 200,
        });
    }
    async getPayoutBatches(tenantId, operatorId) {
        if (!operatorId) {
            throw new common_1.ForbiddenException('Operator user is not linked to an operator');
        }
        return this.prisma.payoutBatch.findMany({
            where: { tenantId, operatorId },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                _count: { select: { trips: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 100,
        });
    }
    async getPayoutBatch(tenantId, operatorId, batchId) {
        if (!operatorId) {
            throw new common_1.ForbiddenException('Operator user is not linked to an operator');
        }
        const batch = await this.prisma.payoutBatch.findFirst({
            where: { id: batchId, tenantId, operatorId },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                trips: {
                    include: {
                        trip: {
                            select: {
                                id: true,
                                internalRef: true,
                                runsheetDate: true,
                                originArea: true,
                                destinationArea: true,
                            },
                        },
                    },
                },
            },
        });
        if (!batch) {
            throw new common_1.NotFoundException('Payout batch not found');
        }
        return batch;
    }
};
exports.OperatorService = OperatorService;
exports.OperatorService = OperatorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OperatorService);
//# sourceMappingURL=operator.service.js.map