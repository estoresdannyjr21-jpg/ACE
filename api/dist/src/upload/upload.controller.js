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
exports.UploadController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const upload_service_1 = require("./upload.service");
let UploadController = class UploadController {
    constructor(upload) {
        this.upload = upload;
    }
    async getFile(type, filename, res) {
        const fileKey = `${type}/${filename}`;
        const filePath = this.upload.getFilePath(fileKey);
        res.sendFile(filePath);
    }
    async uploadFile(file, type) {
        if (!file?.buffer) {
            throw new common_1.BadRequestException('No file uploaded');
        }
        const safeType = type && ['pod', 'reimbursable', 'event-media', 'incident', 'general'].includes(type)
            ? type
            : 'general';
        return this.upload.saveFile(file.buffer, file.originalname || 'file', safeType);
    }
};
exports.UploadController = UploadController;
__decorate([
    (0, common_1.Get)('files/:type/:filename'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.DRIVER, client_1.UserRole.FINANCE_PERSONNEL),
    (0, swagger_1.ApiOperation)({ summary: 'Download a file by type and filename (fileKey = type/filename)' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('filename')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "getFile", null);
__decorate([
    (0, common_1.Post)(),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.OPERATIONS_ACCOUNT_COORDINATOR, client_1.UserRole.DRIVER, client_1.UserRole.FINANCE_PERSONNEL),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 15 * 1024 * 1024 } })),
    (0, swagger_1.ApiOperation)({ summary: 'Upload a file; returns fileKey for use in POD, events, reimbursables, etc.' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                type: { type: 'string', enum: ['pod', 'reimbursable', 'event-media', 'incident', 'general'], description: 'Bucket/folder type' },
            },
        },
    }),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Query)('type')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], UploadController.prototype, "uploadFile", null);
exports.UploadController = UploadController = __decorate([
    (0, swagger_1.ApiTags)('Upload'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('upload'),
    __metadata("design:paramtypes", [upload_service_1.UploadService])
], UploadController);
//# sourceMappingURL=upload.controller.js.map