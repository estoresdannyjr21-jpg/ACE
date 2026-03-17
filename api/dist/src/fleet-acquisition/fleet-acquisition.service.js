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
exports.FleetAcquisitionService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
let FleetAcquisitionService = class FleetAcquisitionService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    async createOperator(userId, tenantId, dto) {
        return this.prisma.operator.create({
            data: {
                tenantId,
                name: dto.name,
                contactName: dto.contactName,
                email: dto.email,
                phone: dto.phone,
                address: dto.address,
                taxId: dto.taxId,
                invoiceType: dto.invoiceType || 'VATABLE',
                bankName: dto.bankName,
                bankAccount: dto.bankAccount,
                bankBranch: dto.bankBranch,
                status: 'ACTIVE',
            },
        });
    }
    maskOperatorBankDetails(operators) {
        return operators.map((op) => ({
            ...op,
            bankName: op.bankName ? '***' : null,
            bankAccount: op.bankAccount ? `****${String(op.bankAccount).slice(-4)}` : null,
            bankBranch: op.bankBranch ? '***' : null,
        }));
    }
    async getOperators(tenantId, options) {
        const list = await this.prisma.operator.findMany({
            where: { tenantId },
            orderBy: { createdAt: 'desc' },
        });
        if (options?.maskBankDetails) {
            return this.maskOperatorBankDetails(list);
        }
        return list;
    }
    async updateOperatorInvoiceType(userId, tenantId, operatorId, invoiceType) {
        const op = await this.prisma.operator.findFirst({
            where: { id: operatorId, tenantId },
        });
        if (!op) {
            throw new common_1.NotFoundException('Operator not found');
        }
        const updated = await this.prisma.operator.update({
            where: { id: operatorId },
            data: { invoiceType },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'UPDATE',
            entityType: 'OPERATOR_INVOICE_TYPE',
            entityId: operatorId,
            changesJson: { invoiceType },
        });
        return updated;
    }
    async createDriver(userId, tenantId, dto) {
        if (dto.operatorId && dto.assignmentStartDate) {
            const operator = await this.prisma.operator.findUnique({
                where: { id: dto.operatorId },
            });
            if (!operator) {
                throw new common_1.NotFoundException('Operator not found');
            }
        }
        const driver = await this.prisma.driver.create({
            data: {
                tenantId,
                spxDriverId: dto.spxDriverId,
                firstName: dto.firstName,
                lastName: dto.lastName,
                phone: dto.phone,
                email: dto.email,
                licenseNumber: dto.licenseNumber,
                status: 'ACTIVE',
            },
        });
        if (dto.operatorId && dto.assignmentStartDate) {
            await this.prisma.driverOperatorAssignment.create({
                data: {
                    driverId: driver.id,
                    operatorId: dto.operatorId,
                    startDate: new Date(dto.assignmentStartDate),
                },
            });
        }
        return driver;
    }
    async getDrivers(tenantId) {
        return this.prisma.driver.findMany({
            where: { tenantId },
            include: {
                assignments: {
                    where: { endDate: null },
                    include: { operator: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
    async createVehicle(userId, tenantId, dto) {
        if (dto.operatorId && dto.assignmentStartDate) {
            const operator = await this.prisma.operator.findUnique({
                where: { id: dto.operatorId },
            });
            if (!operator) {
                throw new common_1.NotFoundException('Operator not found');
            }
        }
        const vehicle = await this.prisma.vehicle.create({
            data: {
                tenantId,
                plateNumber: dto.plateNumber,
                vehicleType: dto.vehicleType,
                bodyType: dto.bodyType,
                status: 'ACTIVE',
            },
        });
        if (dto.operatorId && dto.assignmentStartDate) {
            await this.prisma.vehicleOperatorAssignment.create({
                data: {
                    vehicleId: vehicle.id,
                    operatorId: dto.operatorId,
                    startDate: new Date(dto.assignmentStartDate),
                },
            });
        }
        return vehicle;
    }
    async getVehicles(tenantId) {
        return this.prisma.vehicle.findMany({
            where: { tenantId },
            include: {
                assignments: {
                    where: { endDate: null },
                    include: { operator: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });
    }
};
exports.FleetAcquisitionService = FleetAcquisitionService;
exports.FleetAcquisitionService = FleetAcquisitionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], FleetAcquisitionService);
//# sourceMappingURL=fleet-acquisition.service.js.map