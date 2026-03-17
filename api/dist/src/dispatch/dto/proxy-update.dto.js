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
exports.ProxyIncidentResolveDto = exports.ProxyIncidentUpdateDto = exports.ProxyCreateIncidentDto = exports.ProxyReimbursableDocDto = exports.ProxyPodUploadDto = exports.ProxyTripEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
class ProxyTripEventDto {
}
exports.ProxyTripEventDto = ProxyTripEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for manual encoding (driver cannot update)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyTripEventDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.EventType }),
    (0, class_validator_1.IsEnum)(client_1.EventType),
    __metadata("design:type", String)
], ProxyTripEventDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event time (ISO)' }),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ProxyTripEventDto.prototype, "eventTime", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'TripStop id (optional for trip-level events)' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyTripEventDto.prototype, "stopId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyTripEventDto.prototype, "gpsLat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyTripEventDto.prototype, "gpsLng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyTripEventDto.prototype, "gpsAccuracy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ default: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ProxyTripEventDto.prototype, "capturedOffline", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: 'Photo file keys used as proof' }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.IsNotEmpty)({ each: true }),
    __metadata("design:type", Array)
], ProxyTripEventDto.prototype, "mediaFileKeys", void 0);
class ProxyPodUploadDto {
}
exports.ProxyPodUploadDto = ProxyPodUploadDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for manual encoding (driver cannot upload)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyPodUploadDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Object storage key for POD/Runsheet image/pdf' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyPodUploadDto.prototype, "fileKey", void 0);
class ProxyReimbursableDocDto {
}
exports.ProxyReimbursableDocDto = ProxyReimbursableDocDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for manual encoding (driver cannot upload)' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyReimbursableDocDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ['TOLL', 'GAS', 'PARKING'] }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsIn)(['TOLL', 'GAS', 'PARKING']),
    __metadata("design:type", String)
], ProxyReimbursableDocDto.prototype, "docType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Object storage key for the document' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyReimbursableDocDto.prototype, "fileKey", void 0);
class ProxyCreateIncidentDto {
}
exports.ProxyCreateIncidentDto = ProxyCreateIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for encoding incident on behalf of driver' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyCreateIncidentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IncidentType }),
    (0, class_validator_1.IsEnum)(client_1.IncidentType),
    __metadata("design:type", String)
], ProxyCreateIncidentDto.prototype, "incidentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IncidentSeverity }),
    (0, class_validator_1.IsEnum)(client_1.IncidentSeverity),
    __metadata("design:type", String)
], ProxyCreateIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incident description' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyCreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyCreateIncidentDto.prototype, "gpsLat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyCreateIncidentDto.prototype, "gpsLng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ProxyCreateIncidentDto.prototype, "gpsAccuracy", void 0);
class ProxyIncidentUpdateDto {
}
exports.ProxyIncidentUpdateDto = ProxyIncidentUpdateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for updating incident on behalf of driver' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyIncidentUpdateDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.IncidentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IncidentStatus),
    __metadata("design:type", String)
], ProxyIncidentUpdateDto.prototype, "newStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyIncidentUpdateDto.prototype, "comment", void 0);
class ProxyIncidentResolveDto {
}
exports.ProxyIncidentResolveDto = ProxyIncidentResolveDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Required: reason for resolving incident on behalf of driver' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyIncidentResolveDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resolution notes' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ProxyIncidentResolveDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Replacement trip ID if applicable' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ProxyIncidentResolveDto.prototype, "replacementTripId", void 0);
//# sourceMappingURL=proxy-update.dto.js.map