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
exports.DriverController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const driver_service_1 = require("./driver.service");
const availability_dto_1 = require("./dto/availability.dto");
const trips_dto_1 = require("./dto/trips.dto");
const events_dto_1 = require("./dto/events.dto");
const pod_dto_1 = require("./dto/pod.dto");
const reimbursable_doc_dto_1 = require("./dto/reimbursable-doc.dto");
let DriverController = class DriverController {
    constructor(service) {
        this.service = service;
    }
    async listMyAvailability(req, query) {
        return this.service.listMyAvailability({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            from: query.from,
            to: query.to,
        });
    }
    async setMyAvailability(req, dto) {
        return this.service.setMyAvailability({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            items: dto.items,
        });
    }
    async getMyTrips(req, query) {
        return this.service.getMyTrips({
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            assignmentStatus: query.assignmentStatus,
            highLevelTripStatus: query.highLevelTripStatus,
        });
    }
    async getMyTrip(req, id) {
        return this.service.getMyTrip({ tenantId: req.user.tenantId, driverId: req.user.driverId, tripId: id });
    }
    async acceptTrip(req, id) {
        return this.service.acceptTrip({ tenantId: req.user.tenantId, driverId: req.user.driverId, tripId: id });
    }
    async declineTrip(req, id, dto) {
        return this.service.declineTrip({
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            tripId: id,
            reason: dto.reason,
        });
    }
    async createTripEvent(req, id, dto) {
        return this.service.createTripEvent({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            tripId: id,
            dto,
        });
    }
    async uploadPod(req, id, dto) {
        return this.service.uploadPod({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            tripId: id,
            fileKey: dto.fileKey,
        });
    }
    async uploadReimbursableDoc(req, id, dto) {
        return this.service.uploadReimbursableDoc({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            driverId: req.user.driverId,
            tripId: id,
            docType: dto.docType,
            fileKey: dto.fileKey,
        });
    }
};
exports.DriverController = DriverController;
__decorate([
    (0, common_1.Get)('availability'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my advance booking / availability tags' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, availability_dto_1.GetAvailabilityQueryDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "listMyAvailability", null);
__decorate([
    (0, common_1.Post)('availability'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Set my availability tags in bulk (advance booking, coding day)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, availability_dto_1.SetAvailabilityDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "setMyAvailability", null);
__decorate([
    (0, common_1.Get)('trips'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, swagger_1.ApiOperation)({ summary: 'List my assigned trips' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, trips_dto_1.GetMyTripsQueryDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getMyTrips", null);
__decorate([
    (0, common_1.Get)('trips/:id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, swagger_1.ApiOperation)({ summary: 'Get my trip details' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "getMyTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/accept'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Accept an assigned trip (pending acceptance only)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "acceptTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/decline'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Decline an assigned trip (pending acceptance only)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, trips_dto_1.DeclineTripDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "declineTrip", null);
__decorate([
    (0, common_1.Post)('trips/:id/events'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit a trip stop event (GPS + timestamp + photo proof)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, events_dto_1.CreateTripEventDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "createTripEvent", null);
__decorate([
    (0, common_1.Post)('trips/:id/pod'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Upload POD/Runsheet for a trip (sets POD status to pending review)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, pod_dto_1.UploadPodDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "uploadPod", null);
__decorate([
    (0, common_1.Post)('trips/:id/reimbursable-doc'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.DRIVER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Upload wetlease reimbursable doc (TOLL, GAS, or PARKING)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, reimbursable_doc_dto_1.UploadReimbursableDocDto]),
    __metadata("design:returntype", Promise)
], DriverController.prototype, "uploadReimbursableDoc", null);
exports.DriverController = DriverController = __decorate([
    (0, swagger_1.ApiTags)('Driver App'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('driver'),
    __metadata("design:paramtypes", [driver_service_1.DriverService])
], DriverController);
//# sourceMappingURL=driver.controller.js.map