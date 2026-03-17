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
exports.DispatchController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const dispatch_service_1 = require("./dispatch.service");
const dto_1 = require("./dto");
const availability_query_dto_1 = require("./dto/availability-query.dto");
const operations_dashboard_dto_1 = require("./dto/operations-dashboard.dto");
const proxy_update_dto_1 = require("./dto/proxy-update.dto");
let DispatchController = class DispatchController {
    constructor(service) {
        this.service = service;
    }
    async search(req, q) {
        return this.service.search(req.user.tenantId, q ?? '');
    }
    async lookups(req) {
        return this.service.getLookups(req.user.tenantId);
    }
    async createTrip(req, dto) {
        return this.service.createTrip(req.user.id, req.user.tenantId, dto);
    }
    async getTrips(req, query) {
        return this.service.getTrips(req.user.tenantId, query);
    }
    async getDriverAvailability(req, query) {
        return this.service.getDriverAvailability(req.user.tenantId, query);
    }
    async getOperationsDashboard(req, query) {
        return this.service.getOperationsDashboard(req.user.tenantId, query);
    }
    async getTripById(req, tripId) {
        return this.service.getTripById(req.user.tenantId, tripId);
    }
    async verifyPOD(req, tripId, dto) {
        return this.service.verifyPOD(req.user.id, req.user.tenantId, tripId, dto);
    }
    async rejectPOD(req, tripId, dto) {
        return this.service.rejectPOD(req.user.id, req.user.tenantId, tripId, dto);
    }
    async proxyTripEvent(req, tripId, dto) {
        return this.service.proxyCreateTripEvent({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            tripId,
            dto,
        });
    }
    async proxyPodUpload(req, tripId, dto) {
        return this.service.proxyUploadPod({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            tripId,
            dto,
        });
    }
    async proxyReimbursableDoc(req, tripId, dto) {
        return this.service.proxyUploadReimbursableDoc({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            tripId,
            dto,
        });
    }
    async proxyCreateIncident(req, tripId, dto) {
        return this.service.proxyCreateIncident({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            tripId,
            dto,
        });
    }
    async proxyIncidentUpdate(req, incidentId, dto) {
        return this.service.proxyIncidentUpdate({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            incidentId,
            dto,
        });
    }
    async proxyIncidentResolve(req, incidentId, dto) {
        return this.service.proxyIncidentResolve({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            incidentId,
            dto,
        });
    }
};
exports.DispatchController = DispatchController;
__decorate([
    (0, common_1.Get)('search'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Global search: trips (internal ref), drivers (name), operators (name)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('q')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "search", null);
__decorate([
    (0, common_1.Get)('lookups'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Get lookup data for Dispatch create trip UI' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "lookups", null);
__decorate([
    (0, common_1.Post)('trips'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create trip (requires active route rate for trip date; returns trip and rateExpiryWarning if rate ends within 7 days)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateTripDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "createTrip", null);
__decorate([
    (0, common_1.Get)('trips'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get trips' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetTripsQueryDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getTrips", null);
__decorate([
    (0, common_1.Get)('driver-availability'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'View driver availability (advance booking / coding day) for planning' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, availability_query_dto_1.DriverAvailabilityQueryDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getDriverAvailability", null);
__decorate([
    (0, common_1.Get)('dashboard/operations'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Operations dashboard: counts and lists (pending acceptance, POD, no-update, incidents)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, operations_dashboard_dto_1.OperationsDashboardQueryDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getOperationsDashboard", null);
__decorate([
    (0, common_1.Get)('trips/:id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get trip by ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "getTripById", null);
__decorate([
    (0, common_1.Put)('trips/:id/pod/verify'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Verify POD' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.VerifyPODDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "verifyPOD", null);
__decorate([
    (0, common_1.Put)('trips/:id/pod/reject'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, swagger_1.ApiOperation)({ summary: 'Reject POD' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RejectPODDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "rejectPOD", null);
__decorate([
    (0, common_1.Post)('trips/:id/proxy/events'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Encode a driver trip event on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyTripEventDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyTripEvent", null);
__decorate([
    (0, common_1.Post)('trips/:id/proxy/pod'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Upload POD/Runsheet on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyPodUploadDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyPodUpload", null);
__decorate([
    (0, common_1.Post)('trips/:id/proxy/reimbursable-doc'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Upload TOLL/GAS/PARKING doc on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyReimbursableDocDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyReimbursableDoc", null);
__decorate([
    (0, common_1.Post)('trips/:id/proxy/incidents'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create incident on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyCreateIncidentDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyCreateIncident", null);
__decorate([
    (0, common_1.Post)('incidents/:id/proxy/update'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Add incident update on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyIncidentUpdateDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyIncidentUpdate", null);
__decorate([
    (0, common_1.Post)('incidents/:id/proxy/resolve'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Resolve incident on behalf of driver (manual override)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, proxy_update_dto_1.ProxyIncidentResolveDto]),
    __metadata("design:returntype", Promise)
], DispatchController.prototype, "proxyIncidentResolve", null);
exports.DispatchController = DispatchController = __decorate([
    (0, swagger_1.ApiTags)('Dispatch'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('dispatch'),
    __metadata("design:paramtypes", [dispatch_service_1.DispatchService])
], DispatchController);
//# sourceMappingURL=dispatch.controller.js.map