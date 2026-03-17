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
exports.GetFleetInventoryQueryDto = exports.UpdateFleetInventoryDto = exports.CreateFleetInventoryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateFleetInventoryDto {
}
exports.CreateFleetInventoryDto = CreateFleetInventoryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client account ID (e.g. SPX)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFleetInventoryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Vehicle ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateFleetInventoryDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Tag type', enum: ['PRIMARY', 'SECONDARY'] }),
    (0, class_validator_1.IsIn)(['PRIMARY', 'SECONDARY']),
    __metadata("design:type", String)
], CreateFleetInventoryDto.prototype, "tagType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Effective start (ISO date)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateFleetInventoryDto.prototype, "effectiveStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Effective end (null = ongoing)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateFleetInventoryDto.prototype, "effectiveEnd", void 0);
class UpdateFleetInventoryDto {
}
exports.UpdateFleetInventoryDto = UpdateFleetInventoryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateFleetInventoryDto.prototype, "effectiveEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ['ACTIVE', 'INACTIVE'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['ACTIVE', 'INACTIVE']),
    __metadata("design:type", String)
], UpdateFleetInventoryDto.prototype, "status", void 0);
class GetFleetInventoryQueryDto {
}
exports.GetFleetInventoryQueryDto = GetFleetInventoryQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetFleetInventoryQueryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetFleetInventoryQueryDto.prototype, "vehicleId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only entries effective on this date (ISO)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetFleetInventoryQueryDto.prototype, "effectiveOn", void 0);
//# sourceMappingURL=fleet-inventory.dto.js.map