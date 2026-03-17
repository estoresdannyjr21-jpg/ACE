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
exports.AttachInvoiceDto = exports.GetArBatchesQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class GetArBatchesQueryDto {
}
exports.GetArBatchesQueryDto = GetArBatchesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by client account ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetArBatchesQueryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by service segment', enum: ['FM_ONCALL', 'FM_WETLEASE', 'MFM_ONCALL'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetArBatchesQueryDto.prototype, "serviceSegment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by batch status' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetArBatchesQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cut-off start on or after (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetArBatchesQueryDto.prototype, "cutoffFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Cut-off end on or before (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetArBatchesQueryDto.prototype, "cutoffTo", void 0);
class AttachInvoiceDto {
}
exports.AttachInvoiceDto = AttachInvoiceDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Our invoice number' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AttachInvoiceDto.prototype, "invoiceNumber", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Invoice date (ISO); starts 30-day payment window' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], AttachInvoiceDto.prototype, "invoiceDate", void 0);
//# sourceMappingURL=ar-batch.dto.js.map