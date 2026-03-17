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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetAcquisitionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const fleet_acquisition_service_1 = require("./fleet-acquisition.service");
const dto_1 = require("./dto");
let FleetAcquisitionController = class FleetAcquisitionController {
    constructor(service) {
        this.service = service;
    }
    async createOperator(req, dto) {
        return this.service.createOperator(req.user.id, req.user.tenantId, dto);
    }
    async getOperators(req) {
        const canSeeBankDetails = [
            client_1.UserRole.SUPER_ADMIN,
            client_1.UserRole.ADMIN,
            client_1.UserRole.MANAGER,
            client_1.UserRole.FINANCE_PERSONNEL,
            client_1.UserRole.FINANCE_MANAGER,
            client_1.UserRole.CFO,
        ].includes(req.user.role);
        return this.service.getOperators(req.user.tenantId, {
            maskBankDetails: !canSeeBankDetails,
        });
    }
    async updateOperatorInvoiceType(req, id, dto) {
        return this.service.updateOperatorInvoiceType(req.user.id, req.user.tenantId, id, dto.invoiceType);
    }
    async createDriver(req, dto) {
        return this.service.createDriver(req.user.id, req.user.tenantId, dto);
    }
    async getDrivers(req) {
        return this.service.getDrivers(req.user.tenantId);
    }
    async createVehicle(req, dto) {
        return this.service.createVehicle(req.user.id, req.user.tenantId, dto);
    }
    async getVehicles(req) {
        return this.service.getVehicles(req.user.tenantId);
    }
};
exports.FleetAcquisitionController = FleetAcquisitionController;
__decorate([
    (0, common_1.Post)('operators'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create operator' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateOperatorDto]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "createOperator", null);
__decorate([
    (0, common_1.Get)('operators'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, swagger_1.ApiOperation)({ summary: 'Get all operators (bank details masked for Fleet Acquisition role)' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "getOperators", null);
__decorate([
    (0, common_1.Patch)('operators/:id/invoice-type'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({ summary: 'Update operator invoice type (Admin/Manager only)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateOperatorInvoiceTypeDto]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "updateOperatorInvoiceType", null);
__decorate([
    (0, common_1.Post)('drivers'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create driver' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateDriverDto]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "createDriver", null);
__decorate([
    (0, common_1.Get)('drivers'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, swagger_1.ApiOperation)({ summary: 'Get all drivers' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "getDrivers", null);
__decorate([
    (0, common_1.Post)('vehicles'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create vehicle' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateVehicleDto]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "createVehicle", null);
__decorate([
    (0, common_1.Get)('vehicles'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, swagger_1.ApiOperation)({ summary: 'Get all vehicles' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FleetAcquisitionController.prototype, "getVehicles", null);
exports.FleetAcquisitionController = FleetAcquisitionController = __decorate([
    (0, swagger_1.ApiTags)('Fleet Acquisition'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('fleet-acquisition'),
    __metadata("design:paramtypes", [fleet_acquisition_service_1.FleetAcquisitionService])
], FleetAcquisitionController);
//# sourceMappingURL=fleet-acquisition.controller.js.map