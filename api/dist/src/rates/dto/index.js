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
exports.GetWetleaseFirstTripRatesQueryDto = exports.UpdateWetleaseFirstTripRateDto = exports.CreateWetleaseFirstTripRateDto = exports.GetRouteRatesQueryDto = exports.UpdateRouteRateDto = exports.CreateRouteRateDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
class CreateRouteRateDto {
}
exports.CreateRouteRateDto = CreateRouteRateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client account ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service category ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "serviceCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Origin area code/name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "originArea", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Destination area code/name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "destinationArea", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start of effective period (ISO date)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "effectiveStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End of effective period (null = no end)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateRouteRateDto.prototype, "effectiveEnd", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Amount to bill the client (AR / gross billing line)',
        example: 1500.5,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRouteRateDto.prototype, "billRateAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subcontractor trip rate — VATable base for AP (before invoice type & admin fee)',
        example: 1200,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateRouteRateDto.prototype, "tripPayoutRateVatable", void 0);
class UpdateRouteRateDto {
}
exports.UpdateRouteRateDto = UpdateRouteRateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Origin area code/name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRouteRateDto.prototype, "originArea", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Destination area code/name' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateRouteRateDto.prototype, "destinationArea", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start of effective period (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRouteRateDto.prototype, "effectiveStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End of effective period (null = no end)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRouteRateDto.prototype, "effectiveEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Bill to client (AR)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateRouteRateDto.prototype, "billRateAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Subcontractor VATable payout base (AP)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateRouteRateDto.prototype, "tripPayoutRateVatable", void 0);
class GetRouteRatesQueryDto {
}
exports.GetRouteRatesQueryDto = GetRouteRatesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by client account ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetRouteRatesQueryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by service category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetRouteRatesQueryDto.prototype, "serviceCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by origin area' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetRouteRatesQueryDto.prototype, "originArea", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by destination area' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetRouteRatesQueryDto.prototype, "destinationArea", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Only rates effective on this date (ISO)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetRouteRatesQueryDto.prototype, "effectiveOn", void 0);
class CreateWetleaseFirstTripRateDto {
}
exports.CreateWetleaseFirstTripRateDto = CreateWetleaseFirstTripRateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client account ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWetleaseFirstTripRateDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service category ID (4WCV or 6WCV wetlease only)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWetleaseFirstTripRateDto.prototype, "serviceCategoryId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First wetlease trip of the day (per driver) — gross amount to bill the client (AR)',
        example: 4100.0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateWetleaseFirstTripRateDto.prototype, "firstTripClientBillAmount", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'First wetlease trip of the day (per driver) — subcontractor VATable base (AP, before admin fee / invoice type)',
        example: 3100.0,
    }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], CreateWetleaseFirstTripRateDto.prototype, "firstTripPayoutVatable", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Start of effective period (ISO date/datetime)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateWetleaseFirstTripRateDto.prototype, "effectiveStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End of effective period (omit = open-ended)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateWetleaseFirstTripRateDto.prototype, "effectiveEnd", void 0);
class UpdateWetleaseFirstTripRateDto {
}
exports.UpdateWetleaseFirstTripRateDto = UpdateWetleaseFirstTripRateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'First-trip gross amount billed to client' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateWetleaseFirstTripRateDto.prototype, "firstTripClientBillAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'First-trip subcontractor VATable payout base' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_transformer_1.Type)(() => Number),
    __metadata("design:type", Number)
], UpdateWetleaseFirstTripRateDto.prototype, "firstTripPayoutVatable", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start of effective period (ISO)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateWetleaseFirstTripRateDto.prototype, "effectiveStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End of effective period (null = clear end)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateWetleaseFirstTripRateDto.prototype, "effectiveEnd", void 0);
class GetWetleaseFirstTripRatesQueryDto {
}
exports.GetWetleaseFirstTripRatesQueryDto = GetWetleaseFirstTripRatesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by client account ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetWetleaseFirstTripRatesQueryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by service category ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetWetleaseFirstTripRatesQueryDto.prototype, "serviceCategoryId", void 0);
//# sourceMappingURL=index.js.map