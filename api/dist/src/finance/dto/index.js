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
exports.UpdateReimbursablesDto = exports.RejectOverrideRequestDto = exports.SubmitOverrideRequestDto = exports.SetBatchHeldDto = exports.GetEligibleTripsQueryDto = exports.GetPayoutBatchesQueryDto = exports.CreatePayoutBatchDto = exports.PayoutBatchExclusionDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class PayoutBatchExclusionDto {
}
exports.PayoutBatchExclusionDto = PayoutBatchExclusionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trip ID that is eligible but not included' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayoutBatchExclusionDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reason for not including (mandatory remark)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], PayoutBatchExclusionDto.prototype, "reason", void 0);
class CreatePayoutBatchDto {
}
exports.CreatePayoutBatchDto = CreatePayoutBatchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Operator ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayoutBatchDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Client account ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePayoutBatchDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target release date for this batch (e.g. Monday Mar 2, 2026, ISO date)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePayoutBatchDto.prototype, "targetReleaseDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trip IDs to include in the batch (must be eligible for targetReleaseDate)' }),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreatePayoutBatchDto.prototype, "includedTripIds", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Eligible trips not included: each must have tripId and reason',
        type: [PayoutBatchExclusionDto],
    }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => PayoutBatchExclusionDto),
    __metadata("design:type", Array)
], CreatePayoutBatchDto.prototype, "exclusions", void 0);
class GetPayoutBatchesQueryDto {
}
exports.GetPayoutBatchesQueryDto = GetPayoutBatchesQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPayoutBatchesQueryDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPayoutBatchesQueryDto.prototype, "clientAccountId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetPayoutBatchesQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by target release date (ISO date)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetPayoutBatchesQueryDto.prototype, "targetReleaseDate", void 0);
class GetEligibleTripsQueryDto {
}
exports.GetEligibleTripsQueryDto = GetEligibleTripsQueryDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Target release date (ISO date, e.g. 2026-03-02)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetEligibleTripsQueryDto.prototype, "targetReleaseDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetEligibleTripsQueryDto.prototype, "operatorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetEligibleTripsQueryDto.prototype, "clientAccountId", void 0);
class SetBatchHeldDto {
}
exports.SetBatchHeldDto = SetBatchHeldDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'True = hold payout, false = release' }),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetBatchHeldDto.prototype, "held", void 0);
class SubmitOverrideRequestDto {
}
exports.SubmitOverrideRequestDto = SubmitOverrideRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reason for override (e.g. expired 30-day invoice deadline)' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitOverrideRequestDto.prototype, "reason", void 0);
class RejectOverrideRequestDto {
}
exports.RejectOverrideRequestDto = RejectOverrideRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectOverrideRequestDto.prototype, "rejectionReason", void 0);
class UpdateReimbursablesDto {
}
exports.UpdateReimbursablesDto = UpdateReimbursablesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateReimbursablesDto.prototype, "tollAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateReimbursablesDto.prototype, "gasAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateReimbursablesDto.prototype, "parkingAmount", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.ReimbursableStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.ReimbursableStatus),
    __metadata("design:type", String)
], UpdateReimbursablesDto.prototype, "reimbursableStatus", void 0);
//# sourceMappingURL=index.js.map