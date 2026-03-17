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
exports.AddIncidentMediaDto = exports.ResolveIncidentDto = exports.AddIncidentUpdateDto = exports.CreateIncidentDto = exports.GetIncidentsQueryDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const client_1 = require("@prisma/client");
class GetIncidentsQueryDto {
}
exports.GetIncidentsQueryDto = GetIncidentsQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.IncidentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IncidentStatus),
    __metadata("design:type", String)
], GetIncidentsQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.IncidentSeverity }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IncidentSeverity),
    __metadata("design:type", String)
], GetIncidentsQueryDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Filter by trip ID' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetIncidentsQueryDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'From date (reportedAt), ISO' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetIncidentsQueryDto.prototype, "dateFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'To date (reportedAt), ISO' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetIncidentsQueryDto.prototype, "dateTo", void 0);
class CreateIncidentDto {
}
exports.CreateIncidentDto = CreateIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Trip ID' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "tripId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IncidentType }),
    (0, class_validator_1.IsEnum)(client_1.IncidentType),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "incidentType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: client_1.IncidentSeverity }),
    (0, class_validator_1.IsEnum)(client_1.IncidentSeverity),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Incident description' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-90),
    (0, class_validator_1.Max)(90),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "gpsLat", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(-180),
    (0, class_validator_1.Max)(180),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "gpsLng", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateIncidentDto.prototype, "gpsAccuracy", void 0);
class AddIncidentUpdateDto {
}
exports.AddIncidentUpdateDto = AddIncidentUpdateDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: client_1.IncidentStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(client_1.IncidentStatus),
    __metadata("design:type", String)
], AddIncidentUpdateDto.prototype, "newStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddIncidentUpdateDto.prototype, "comment", void 0);
class ResolveIncidentDto {
}
exports.ResolveIncidentDto = ResolveIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Resolution notes' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveIncidentDto.prototype, "resolutionNotes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Replacement trip ID if applicable' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ResolveIncidentDto.prototype, "replacementTripId", void 0);
class AddIncidentMediaDto {
}
exports.AddIncidentMediaDto = AddIncidentMediaDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'S3/storage file key for uploaded media' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddIncidentMediaDto.prototype, "fileKey", void 0);
//# sourceMappingURL=index.js.map