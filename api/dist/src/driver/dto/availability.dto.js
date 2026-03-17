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
exports.GetAvailabilityQueryDto = exports.SetAvailabilityDto = exports.SetAvailabilityItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class SetAvailabilityItemDto {
}
exports.SetAvailabilityItemDto = SetAvailabilityItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Day to tag (ISO date). Use day-only, e.g. 2026-02-10' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SetAvailabilityItemDto.prototype, "date", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.DriverAvailabilityStatus }),
    (0, class_validator_1.IsEnum)(client_1.DriverAvailabilityStatus),
    __metadata("design:type", String)
], SetAvailabilityItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SetAvailabilityItemDto.prototype, "note", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'If true, this day is a coding day (independent of availability)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetAvailabilityItemDto.prototype, "codingDay", void 0);
class SetAvailabilityDto {
}
exports.SetAvailabilityDto = SetAvailabilityDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [SetAvailabilityItemDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SetAvailabilityItemDto),
    __metadata("design:type", Array)
], SetAvailabilityDto.prototype, "items", void 0);
class GetAvailabilityQueryDto {
}
exports.GetAvailabilityQueryDto = GetAvailabilityQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'From date (ISO)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAvailabilityQueryDto.prototype, "from", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'To date (ISO)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAvailabilityQueryDto.prototype, "to", void 0);
//# sourceMappingURL=availability.dto.js.map