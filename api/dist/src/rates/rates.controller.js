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
exports.RatesController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const rates_service_1 = require("./rates.service");
const dto_1 = require("./dto");
let RatesController = class RatesController {
    constructor(service) {
        this.service = service;
    }
    async create(req, dto) {
        return this.service.createRouteRate(req.user.id, req.user.tenantId, dto);
    }
    async findAll(req, query) {
        return this.service.getRouteRates(req.user.tenantId, query);
    }
    async lookups(req) {
        return this.service.getLookups(req.user.tenantId);
    }
    async findOne(req, id) {
        return this.service.getRouteRateById(req.user.tenantId, id);
    }
    async update(req, id, dto) {
        return this.service.updateRouteRate(req.user.tenantId, id, dto);
    }
    async remove(req, id) {
        return this.service.deleteRouteRate(req.user.tenantId, id);
    }
    async importRatesCsv(req, file, commit, mode) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const doCommit = commit === 'true';
        return this.service.importRatesFromCsv({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            csvBuffer: file.buffer,
            commit: doCommit,
            mode: mode ?? 'upsert',
        });
    }
};
exports.RatesController = RatesController;
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create route rate' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateRouteRateDto]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'List route rates with optional filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetRouteRatesQueryDto]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('lookups'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get lookup data for rates UI' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "lookups", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get route rate by ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Update route rate' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateRouteRateDto]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Delete route rate' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 2 * 1024 * 1024 } })),
    (0, swagger_1.ApiOperation)({
        summary: 'Import route rates from CSV (download template first; supports preview mode and commit mode)',
    }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                commit: {
                    type: 'string',
                    enum: ['true', 'false'],
                    description: 'If \"true\", changes are saved. If \"false\" or omitted, runs in preview mode (no changes).',
                },
            },
            required: ['file'],
        },
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('commit')),
    __param(3, (0, common_1.Query)('mode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String]),
    __metadata("design:returntype", Promise)
], RatesController.prototype, "importRatesCsv", null);
exports.RatesController = RatesController = __decorate([
    (0, swagger_1.ApiTags)('Rates'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('rates'),
    __metadata("design:paramtypes", [rates_service_1.RatesService])
], RatesController);
//# sourceMappingURL=rates.controller.js.map