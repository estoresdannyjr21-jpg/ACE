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
exports.RatesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
let RatesService = class RatesService {
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
        this.SEGMENT_TO_CATEGORY_CODES = {
            FM_ONCALL: ['SPX_FM_4W_ONCALL', 'SPX_FM_6WCV_ONCALL', 'SPX_FM_10W_ONCALL'],
            FM_WETLEASE: ['SPX_FM_4WCV_WETLEASE', 'SPX_FM_6WCV_WETLEASE'],
            MFM_ONCALL: ['SPX_MEGA_FM_6W', 'SPX_MEGA_FM_10W', 'SPX_MFM_SHUNTING_6W'],
        };
    }
    async getLookups(tenantId) {
        const clients = await this.prisma.clientAccount.findMany({
            where: { tenantId, status: 'ACTIVE' },
            select: {
                id: true,
                name: true,
                code: true,
                serviceCategories: {
                    where: { status: 'ACTIVE' },
                    select: { id: true, name: true, code: true },
                    orderBy: { name: 'asc' },
                },
            },
            orderBy: { name: 'asc' },
        });
        return { clients };
    }
    async createRouteRate(userId, tenantId, dto) {
        await this.validateClientAndCategory(tenantId, dto.clientAccountId, dto.serviceCategoryId);
        const effectiveStart = new Date(dto.effectiveStart);
        const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
        if (effectiveEnd && effectiveEnd <= effectiveStart) {
            throw new common_1.BadRequestException('effectiveEnd must be after effectiveStart');
        }
        const endOfTime = new Date('9999-12-31');
        const overlapping = await this.prisma.routeRate.findFirst({
            where: {
                tenantId,
                clientAccountId: dto.clientAccountId,
                serviceCategoryId: dto.serviceCategoryId,
                originArea: dto.originArea,
                destinationArea: dto.destinationArea,
                effectiveStart: { lte: effectiveEnd ?? endOfTime },
                OR: [
                    { effectiveEnd: null },
                    { effectiveEnd: { gte: effectiveStart } },
                ],
            },
        });
        if (overlapping) {
            throw new common_1.ConflictException('A rate already exists for this route and overlapping effective period');
        }
        const rate = await this.prisma.routeRate.create({
            data: {
                tenantId,
                clientAccountId: dto.clientAccountId,
                serviceCategoryId: dto.serviceCategoryId,
                originArea: dto.originArea,
                destinationArea: dto.destinationArea,
                effectiveStart,
                effectiveEnd,
                billRateAmount: new client_1.Prisma.Decimal(dto.billRateAmount),
                tripPayoutRateVatable: new client_1.Prisma.Decimal(dto.tripPayoutRateVatable),
            },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
        });
        await this.audit.log({
            tenantId,
            userId,
            action: 'CREATE',
            entityType: 'ROUTE_RATE',
            entityId: rate.id,
            changesJson: { originArea: dto.originArea, destinationArea: dto.destinationArea },
        });
        return rate;
    }
    async getRouteRates(tenantId, query) {
        const effectiveOn = query.effectiveOn ? new Date(query.effectiveOn) : null;
        const where = {
            tenantId,
            ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
            ...(query.serviceCategoryId && { serviceCategoryId: query.serviceCategoryId }),
            ...(query.originArea && { originArea: query.originArea }),
            ...(query.destinationArea && { destinationArea: query.destinationArea }),
            ...(effectiveOn && {
                effectiveStart: { lte: effectiveOn },
                OR: [
                    { effectiveEnd: null },
                    { effectiveEnd: { gte: effectiveOn } },
                ],
            }),
        };
        return this.prisma.routeRate.findMany({
            where,
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
            orderBy: [
                { originArea: 'asc' },
                { destinationArea: 'asc' },
                { effectiveStart: 'desc' },
            ],
        });
    }
    async getRouteRateById(tenantId, id) {
        const rate = await this.prisma.routeRate.findFirst({
            where: { id, tenantId },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
        });
        if (!rate) {
            throw new common_1.NotFoundException('Route rate not found');
        }
        return rate;
    }
    async updateRouteRate(tenantId, id, dto) {
        const existing = await this.prisma.routeRate.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Route rate not found');
        }
        const effectiveStart = dto.effectiveStart
            ? new Date(dto.effectiveStart)
            : existing.effectiveStart;
        const effectiveEnd = dto.effectiveEnd !== undefined
            ? (dto.effectiveEnd ? new Date(dto.effectiveEnd) : null)
            : existing.effectiveEnd;
        if (effectiveEnd && effectiveEnd <= effectiveStart) {
            throw new common_1.BadRequestException('effectiveEnd must be after effectiveStart');
        }
        return this.prisma.routeRate.update({
            where: { id },
            data: {
                ...(dto.originArea !== undefined && { originArea: dto.originArea }),
                ...(dto.destinationArea !== undefined && { destinationArea: dto.destinationArea }),
                ...(dto.effectiveStart !== undefined && { effectiveStart: new Date(dto.effectiveStart) }),
                ...(dto.effectiveEnd !== undefined && {
                    effectiveEnd: dto.effectiveEnd ? new Date(dto.effectiveEnd) : null,
                }),
                ...(dto.billRateAmount !== undefined && {
                    billRateAmount: new client_1.Prisma.Decimal(dto.billRateAmount),
                }),
                ...(dto.tripPayoutRateVatable !== undefined && {
                    tripPayoutRateVatable: new client_1.Prisma.Decimal(dto.tripPayoutRateVatable),
                }),
            },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
        });
    }
    async deleteRouteRate(tenantId, id) {
        const existing = await this.prisma.routeRate.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Route rate not found');
        }
        await this.prisma.routeRate.delete({ where: { id } });
        return { deleted: true, id };
    }
    async getActiveRateForTrip(tenantId, clientAccountId, serviceCategoryId, originArea, destinationArea, asOfDate) {
        const rate = await this.prisma.routeRate.findFirst({
            where: {
                tenantId,
                clientAccountId,
                serviceCategoryId,
                originArea,
                destinationArea,
                effectiveStart: { lte: asOfDate },
                OR: [
                    { effectiveEnd: null },
                    { effectiveEnd: { gte: asOfDate } },
                ],
            },
            orderBy: { effectiveStart: 'desc' },
        });
        return rate ?? null;
    }
    async validateClientAndCategory(tenantId, clientAccountId, serviceCategoryId) {
        const client = await this.prisma.clientAccount.findFirst({
            where: { id: clientAccountId, tenantId },
            include: { serviceCategories: { where: { id: serviceCategoryId } } },
        });
        if (!client) {
            throw new common_1.BadRequestException('Client account not found');
        }
        if (client.serviceCategories.length === 0) {
            throw new common_1.BadRequestException('Service category not found or not linked to this client');
        }
    }
    async importRatesFromCsv(params) {
        const allowedModes = ['create', 'update', 'upsert'];
        if (!allowedModes.includes(params.mode)) {
            throw new common_1.BadRequestException(`Invalid mode "${params.mode}". Must be one of: ${allowedModes.join(', ')}`);
        }
        const text = params.csvBuffer.toString('utf8');
        const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        if (lines.length === 0) {
            throw new common_1.BadRequestException('CSV file is empty');
        }
        const header = lines[0].split(',').map((h) => h.trim());
        const requiredCols = [
            'client_code',
            'service_segment',
            'service_category_code',
            'origin_area_code',
            'destination_area_code',
            'base_rate',
            'currency',
            'effective_from',
        ];
        for (const col of requiredCols) {
            if (!header.includes(col)) {
                throw new common_1.BadRequestException(`Missing required column in header: ${col}`);
            }
        }
        const colIndex = (name) => header.indexOf(name);
        const idxClientCode = colIndex('client_code');
        const idxSegment = colIndex('service_segment');
        const idxCategory = colIndex('service_category_code');
        const idxOrigin = colIndex('origin_area_code');
        const idxDest = colIndex('destination_area_code');
        const idxBaseRate = colIndex('base_rate');
        const idxCurrency = colIndex('currency');
        const idxEffFrom = colIndex('effective_from');
        const idxEffTo = header.indexOf('effective_to');
        const parsed = [];
        const errors = [];
        const parseDate = (value) => {
            if (!value)
                return null;
            const d = new Date(value);
            return Number.isNaN(d.getTime()) ? null : d;
        };
        for (let i = 1; i < lines.length; i++) {
            const rowNumber = i + 1;
            const raw = lines[i];
            const cols = raw.split(',').map((c) => c.trim());
            if (cols.length === 1 && cols[0] === '')
                continue;
            const clientCode = cols[idxClientCode] || '';
            const serviceSegment = cols[idxSegment] || '';
            const serviceCategoryCode = cols[idxCategory] || '';
            const originArea = cols[idxOrigin] || '';
            const destinationArea = cols[idxDest] || '';
            const baseRateStr = cols[idxBaseRate] || '';
            const currency = cols[idxCurrency] || '';
            const effFromStr = cols[idxEffFrom] || '';
            const effToStr = idxEffTo >= 0 ? cols[idxEffTo] || '' : '';
            const rowErrors = [];
            if (!clientCode)
                rowErrors.push('client_code is required');
            if (!serviceSegment)
                rowErrors.push('service_segment is required');
            if (!serviceCategoryCode)
                rowErrors.push('service_category_code is required');
            if (!originArea)
                rowErrors.push('origin_area_code is required');
            if (!destinationArea)
                rowErrors.push('destination_area_code is required');
            if (!baseRateStr)
                rowErrors.push('base_rate is required');
            if (!currency)
                rowErrors.push('currency is required');
            if (!effFromStr)
                rowErrors.push('effective_from is required');
            const allowedSegments = Object.keys(this.SEGMENT_TO_CATEGORY_CODES);
            if (serviceSegment && !allowedSegments.includes(serviceSegment)) {
                rowErrors.push(`service_segment must be one of ${allowedSegments.join(', ')}; got "${serviceSegment}"`);
            }
            if (serviceSegment &&
                serviceCategoryCode &&
                this.SEGMENT_TO_CATEGORY_CODES[serviceSegment] &&
                !this.SEGMENT_TO_CATEGORY_CODES[serviceSegment].includes(serviceCategoryCode)) {
                rowErrors.push(`service_category_code "${serviceCategoryCode}" does not belong to segment "${serviceSegment}"`);
            }
            const baseRate = Number(baseRateStr);
            if (!Number.isFinite(baseRate) || baseRate <= 0) {
                rowErrors.push('base_rate must be a positive number');
            }
            const effStart = parseDate(effFromStr);
            if (!effStart) {
                rowErrors.push(`effective_from is not a valid date (expected YYYY-MM-DD): "${effFromStr}"`);
            }
            const effEnd = parseDate(effToStr);
            if (effEndStrPresent(effToStr) && !effEnd) {
                rowErrors.push(`effective_to is not a valid date (expected YYYY-MM-DD): "${effToStr}"`);
            }
            if (effStart && effEnd && effEnd <= effStart) {
                rowErrors.push('effective_to must be after effective_from');
            }
            if (rowErrors.length > 0) {
                errors.push({ rowNumber, message: rowErrors.join('; ') });
                continue;
            }
            parsed.push({
                rowNumber,
                clientCode,
                serviceSegment,
                serviceCategoryCode,
                originArea,
                destinationArea,
                baseRate,
                currency,
                effectiveStart: effStart,
                effectiveEnd: effEnd,
            });
        }
        if (parsed.length === 0) {
            return {
                mode: params.commit ? 'commit' : 'preview',
                importMode: params.mode,
                totalRows: lines.length - 1,
                validRows: 0,
                created: 0,
                updated: 0,
                errors,
            };
        }
        const createdIds = [];
        const updatedIds = [];
        const endOfTime = new Date('9999-12-31');
        const trxFn = async (tx) => {
            for (const row of parsed) {
                const client = await tx.clientAccount.findFirst({
                    where: { tenantId: params.tenantId, code: row.clientCode, status: 'ACTIVE' },
                    select: { id: true },
                });
                if (!client) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        message: `Unknown or inactive client_code "${row.clientCode}"`,
                    });
                    continue;
                }
                const category = await tx.serviceCategory.findFirst({
                    where: { clientAccountId: client.id, code: row.serviceCategoryCode, status: 'ACTIVE' },
                    select: { id: true },
                });
                if (!category) {
                    errors.push({
                        rowNumber: row.rowNumber,
                        message: `Unknown or inactive service_category_code "${row.serviceCategoryCode}" for client "${row.clientCode}"`,
                    });
                    continue;
                }
                const overlapping = await tx.routeRate.findFirst({
                    where: {
                        tenantId: params.tenantId,
                        clientAccountId: client.id,
                        serviceCategoryId: category.id,
                        originArea: row.originArea,
                        destinationArea: row.destinationArea,
                        effectiveStart: { lte: row.effectiveEnd ?? endOfTime },
                        OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: row.effectiveStart } }],
                    },
                });
                const existing = await tx.routeRate.findFirst({
                    where: {
                        tenantId: params.tenantId,
                        clientAccountId: client.id,
                        serviceCategoryId: category.id,
                        originArea: row.originArea,
                        destinationArea: row.destinationArea,
                        effectiveStart: row.effectiveStart,
                    },
                });
                if (params.mode === 'create') {
                    if (existing || overlapping) {
                        errors.push({
                            rowNumber: row.rowNumber,
                            message: 'Create-only mode: a rate already exists or overlaps for this route and period',
                        });
                        continue;
                    }
                    if (params.commit) {
                        const created = await tx.routeRate.create({
                            data: {
                                tenantId: params.tenantId,
                                clientAccountId: client.id,
                                serviceCategoryId: category.id,
                                originArea: row.originArea,
                                destinationArea: row.destinationArea,
                                effectiveStart: row.effectiveStart,
                                effectiveEnd: row.effectiveEnd,
                                billRateAmount: new client_1.Prisma.Decimal(row.baseRate),
                                tripPayoutRateVatable: new client_1.Prisma.Decimal(row.baseRate),
                            },
                        });
                        createdIds.push(created.id);
                    }
                }
                else if (params.mode === 'update') {
                    if (!existing) {
                        errors.push({
                            rowNumber: row.rowNumber,
                            message: 'Update-only mode: no existing rate found with the same client, category, route, and effective_from',
                        });
                        continue;
                    }
                    if (overlapping && overlapping.id !== existing.id) {
                        errors.push({
                            rowNumber: row.rowNumber,
                            message: 'Update-only mode: another rate already exists for this route and overlapping effective period',
                        });
                        continue;
                    }
                    if (params.commit) {
                        const updated = await tx.routeRate.update({
                            where: { id: existing.id },
                            data: {
                                effectiveEnd: row.effectiveEnd,
                                billRateAmount: new client_1.Prisma.Decimal(row.baseRate),
                                tripPayoutRateVatable: new client_1.Prisma.Decimal(row.baseRate),
                            },
                        });
                        updatedIds.push(updated.id);
                    }
                }
                else {
                    if (existing) {
                        if (overlapping && overlapping.id !== existing.id) {
                            errors.push({
                                rowNumber: row.rowNumber,
                                message: 'Upsert mode: a different rate already exists for this route and overlapping effective period',
                            });
                            continue;
                        }
                        if (params.commit) {
                            const updated = await tx.routeRate.update({
                                where: { id: existing.id },
                                data: {
                                    effectiveEnd: row.effectiveEnd,
                                    billRateAmount: new client_1.Prisma.Decimal(row.baseRate),
                                    tripPayoutRateVatable: new client_1.Prisma.Decimal(row.baseRate),
                                },
                            });
                            updatedIds.push(updated.id);
                        }
                    }
                    else {
                        if (overlapping) {
                            errors.push({
                                rowNumber: row.rowNumber,
                                message: 'Upsert mode: a rate already exists for this route and overlapping effective period (no new record created).',
                            });
                            continue;
                        }
                        if (params.commit) {
                            const created = await tx.routeRate.create({
                                data: {
                                    tenantId: params.tenantId,
                                    clientAccountId: client.id,
                                    serviceCategoryId: category.id,
                                    originArea: row.originArea,
                                    destinationArea: row.destinationArea,
                                    effectiveStart: row.effectiveStart,
                                    effectiveEnd: row.effectiveEnd,
                                    billRateAmount: new client_1.Prisma.Decimal(row.baseRate),
                                    tripPayoutRateVatable: new client_1.Prisma.Decimal(row.baseRate),
                                },
                            });
                            createdIds.push(created.id);
                        }
                    }
                }
            }
        };
        if (params.commit) {
            await this.prisma.$transaction(async (tx) => {
                await trxFn(tx);
            });
            if (createdIds.length || updatedIds.length) {
                await this.audit.log({
                    tenantId: params.tenantId,
                    userId: params.userId,
                    action: 'IMPORT',
                    entityType: 'ROUTE_RATE',
                    entityId: createdIds.concat(updatedIds).join(','),
                    changesJson: {
                        createdCount: createdIds.length,
                        updatedCount: updatedIds.length,
                    },
                });
            }
        }
        else {
        }
        return {
            mode: params.commit ? 'commit' : 'preview',
            importMode: params.mode,
            totalRows: lines.length - 1,
            validRows: parsed.length,
            created: params.commit ? createdIds.length : 0,
            updated: params.commit ? updatedIds.length : 0,
            errors,
        };
        function effEndStrPresent(value) {
            return value !== undefined && value !== null && value.trim().length > 0;
        }
    }
};
exports.RatesService = RatesService;
exports.RatesService = RatesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], RatesService);
//# sourceMappingURL=rates.service.js.map