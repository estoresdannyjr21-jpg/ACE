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
exports.FleetInventoryController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const fleet_inventory_service_1 = require("./fleet-inventory.service");
const fleet_inventory_dto_1 = require("./dto/fleet-inventory.dto");
let FleetInventoryController = class FleetInventoryController {
    constructor(service) {
        this.service = service;
    }
    async create(req, dto) {
        return this.service.create(req.user.tenantId, dto);
    }
    async findMany(req, query) {
        return this.service.findMany(req.user.tenantId, query);
    }
    async findOne(req, id) {
        return this.service.findOne(req.user.tenantId, id);
    }
    async update(req, id, dto) {
        return this.service.update(req.user.tenantId, id, dto);
    }
    async remove(req, id) {
        return this.service.remove(req.user.tenantId, id);
    }
};
exports.FleetInventoryController = FleetInventoryController;
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Tag vehicle for client (PRIMARY/SECONDARY)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fleet_inventory_dto_1.CreateFleetInventoryDto]),
    __metadata("design:returntype", Promise)
], FleetInventoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'List fleet inventory with optional filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, fleet_inventory_dto_1.GetFleetInventoryQueryDto]),
    __metadata("design:returntype", Promise)
], FleetInventoryController.prototype, "findMany", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get fleet inventory entry by ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FleetInventoryController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, swagger_1.ApiOperation)({ summary: 'Update effective end or status' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, fleet_inventory_dto_1.UpdateFleetInventoryDto]),
    __metadata("design:returntype", Promise)
], FleetInventoryController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FLEET_ACQUISITION),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Remove fleet inventory entry' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FleetInventoryController.prototype, "remove", null);
exports.FleetInventoryController = FleetInventoryController = __decorate([
    (0, swagger_1.ApiTags)('Fleet Acquisition - Fleet Inventory'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('fleet-acquisition/fleet-inventory'),
    __metadata("design:paramtypes", [fleet_inventory_service_1.FleetInventoryService])
], FleetInventoryController);
//# sourceMappingURL=fleet-inventory.controller.js.map