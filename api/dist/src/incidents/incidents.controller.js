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
exports.IncidentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const incidents_service_1 = require("./incidents.service");
const dto_1 = require("./dto");
let IncidentsController = class IncidentsController {
    constructor(service) {
        this.service = service;
    }
    async findAll(req, query) {
        return this.service.findMany(req.user.tenantId, query);
    }
    async create(req, dto) {
        return this.service.create(req.user.id, req.user.tenantId, dto);
    }
    async findByTrip(req, tripId) {
        return this.service.findByTrip(req.user.tenantId, tripId);
    }
    async findOne(req, id) {
        return this.service.findOne(req.user.tenantId, id);
    }
    async addUpdate(req, id, dto) {
        return this.service.addUpdate(req.user.id, req.user.tenantId, id, dto);
    }
    async resolve(req, id, dto) {
        return this.service.resolve(req.user.id, req.user.tenantId, id, dto);
    }
    async close(req, id) {
        return this.service.close(req.user.tenantId, id);
    }
    async addMedia(req, id, dto) {
        return this.service.addMedia(req.user.tenantId, id, dto);
    }
};
exports.IncidentsController = IncidentsController;
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'List incidents with optional filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetIncidentsQueryDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Report trip incident' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateIncidentDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('trip/:tripId'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO, client_1.UserRole.DRIVER),
    (0, swagger_1.ApiOperation)({ summary: 'List incidents for a trip' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('tripId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findByTrip", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO, client_1.UserRole.DRIVER),
    (0, swagger_1.ApiOperation)({ summary: 'Get incident by ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(':id/updates'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Add status/comment update to incident' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AddIncidentUpdateDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "addUpdate", null);
__decorate([
    (0, common_1.Post)(':id/resolve'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve incident (with optional replacement trip)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.ResolveIncidentDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "resolve", null);
__decorate([
    (0, common_1.Post)(':id/close'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Close resolved incident' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "close", null);
__decorate([
    (0, common_1.Post)(':id/media'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Attach media to incident (provide fileKey after upload)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.AddIncidentMediaDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "addMedia", null);
exports.IncidentsController = IncidentsController = __decorate([
    (0, swagger_1.ApiTags)('Incidents'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('incidents'),
    __metadata("design:paramtypes", [incidents_service_1.IncidentsService])
], IncidentsController);
//# sourceMappingURL=incidents.controller.js.map