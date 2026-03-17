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
exports.OperatorController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const operator_service_1 = require("./operator.service");
const upload_service_1 = require("../upload/upload.service");
let OperatorController = class OperatorController {
    constructor(service, upload) {
        this.service = service;
        this.upload = upload;
    }
    async getTrips(req, query) {
        return this.service.getTrips(req.user.tenantId, req.user.operatorId, query);
    }
    async getPayoutBatches(req) {
        return this.service.getPayoutBatches(req.user.tenantId, req.user.operatorId);
    }
    async getPayoutBatch(req, id) {
        return this.service.getPayoutBatch(req.user.tenantId, req.user.operatorId, id);
    }
    async getPayslip(req, id, res) {
        const batch = await this.service.getPayoutBatch(req.user.tenantId, req.user.operatorId, id);
        if (!batch.payslipFileKey) {
            throw new common_1.NotFoundException('Payslip not yet available for this batch');
        }
        const filePath = this.upload.getFilePath(batch.payslipFileKey);
        res.setHeader('Content-Type', 'application/pdf');
        res.sendFile(filePath);
    }
};
exports.OperatorController = OperatorController;
__decorate([
    (0, common_1.Get)('trips'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.OPERATOR_USER),
    (0, swagger_1.ApiOperation)({ summary: 'List trips for the operator user' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OperatorController.prototype, "getTrips", null);
__decorate([
    (0, common_1.Get)('payout-batches'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.OPERATOR_USER),
    (0, swagger_1.ApiOperation)({ summary: 'List payout batches for the operator user' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OperatorController.prototype, "getPayoutBatches", null);
__decorate([
    (0, common_1.Get)('payout-batches/:id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.OPERATOR_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout batch (includes payslipFileKey once CFO approved)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], OperatorController.prototype, "getPayoutBatch", null);
__decorate([
    (0, common_1.Get)('payout-batches/:id/payslip'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.OPERATOR_USER),
    (0, swagger_1.ApiOperation)({ summary: 'Download payslip PDF (only for CFO-approved batches)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OperatorController.prototype, "getPayslip", null);
exports.OperatorController = OperatorController = __decorate([
    (0, swagger_1.ApiTags)('Operator Portal'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('operator'),
    __metadata("design:paramtypes", [operator_service_1.OperatorService,
        upload_service_1.UploadService])
], OperatorController);
//# sourceMappingURL=operator.controller.js.map