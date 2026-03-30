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
exports.RatesService = exports.WETLEASE_CATEGORY_CODES = void 0;
exports.utcCalendarDayBounds = utcCalendarDayBounds;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const client_1 = require("@prisma/client");
exports.WETLEASE_CATEGORY_CODES = new Set([
    'SPX_FM_4WCV_WETLEASE',
    'SPX_FM_6WCV_WETLEASE',
]);
const WETLEASE_FIRST_TRIP_FALLBACK = {
    SPX_FM_4WCV_WETLEASE: { client: 4100.0, subcontractor: 3100.0 },
    SPX_FM_6WCV_WETLEASE: { client: 4333.33, subcontractor: 3333.33 },
};
function utcCalendarDayBounds(d) {
    const y = d.getUTCFullYear();
    const mObj = d.getUTCMonth();
    const day = d.getUTCDate();
    return {
        dayStart: new Date(Date.UTC(y, mObj, day, 0, 0, 0, 0)),
        dayEnd: new Date(Date.UTC(y, mObj, day, 23, 59, 59, 999)),
    };
}
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
    isWetleaseCategoryCode(code) {
        return !!code && exports.WETLEASE_CATEGORY_CODES.has(code);
    }
    async resolveWetleaseFirstTripPayoutAmount(tenantId, clientAccountId, serviceCategoryId, asOfDate) {
        const row = await this.prisma.wetleaseFirstTripRate.findFirst({
            where: {
                tenantId,
                clientAccountId,
                serviceCategoryId,
                effectiveStart: { lte: asOfDate },
                OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: asOfDate } }],
            },
            orderBy: { effectiveStart: 'desc' },
        });
        if (row) {
            return Number(row.firstTripPayoutVatable);
        }
        const cat = await this.prisma.serviceCategory.findFirst({
            where: { id: serviceCategoryId, clientAccountId },
            select: { code: true },
        });
        const code = cat?.code;
        const fb = code ? WETLEASE_FIRST_TRIP_FALLBACK[code] : undefined;
        if (fb) {
            return fb.subcontractor;
        }
        throw new common_1.BadRequestException('No wetlease first-trip rate row for this category and date. Add one under GET /rates/wetlease-first-trip or seed the table.');
    }
    async resolveWetleaseFirstTripClientBillAmount(tenantId, clientAccountId, serviceCategoryId, asOfDate) {
        const row = await this.prisma.wetleaseFirstTripRate.findFirst({
            where: {
                tenantId,
                clientAccountId,
                serviceCategoryId,
                effectiveStart: { lte: asOfDate },
                OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: asOfDate } }],
            },
            orderBy: { effectiveStart: 'desc' },
        });
        if (row?.firstTripClientBillAmount != null) {
            return Number(row.firstTripClientBillAmount);
        }
        const cat = await this.prisma.serviceCategory.findFirst({
            where: { id: serviceCategoryId, clientAccountId },
            select: { code: true },
        });
        const code = cat?.code;
        const fb = code ? WETLEASE_FIRST_TRIP_FALLBACK[code] : undefined;
        if (fb) {
            return fb.client;
        }
        throw new common_1.BadRequestException('No wetlease client bill amount for this category and date. Set firstTripClientBillAmount on the wetlease rate row.');
    }
    async listWetleaseFirstTripRates(tenantId, query) {
        return this.prisma.wetleaseFirstTripRate.findMany({
            where: {
                tenantId,
                ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
                ...(query.serviceCategoryId && { serviceCategoryId: query.serviceCategoryId }),
            },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
            orderBy: [{ serviceCategory: { code: 'asc' } }, { effectiveStart: 'desc' }],
        });
    }
    async createWetleaseFirstTripRate(userId, tenantId, dto) {
        await this.validateClientAndCategory(tenantId, dto.clientAccountId, dto.serviceCategoryId);
        await this.assertWetleaseCategoryOrThrow(tenantId, dto.serviceCategoryId);
        const effectiveStart = new Date(dto.effectiveStart);
        const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
        if (effectiveEnd && effectiveEnd <= effectiveStart) {
            throw new common_1.BadRequestException('effectiveEnd must be after effectiveStart');
        }
        const endOfTime = new Date('9999-12-31');
        const overlapping = await this.prisma.wetleaseFirstTripRate.findFirst({
            where: {
                tenantId,
                clientAccountId: dto.clientAccountId,
                serviceCategoryId: dto.serviceCategoryId,
                effectiveStart: { lte: effectiveEnd ?? endOfTime },
                OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: effectiveStart } }],
            },
        });
        if (overlapping) {
            throw new common_1.ConflictException('A wetlease first-trip rate already exists for this client/category with an overlapping effective period');
        }
        const row = await this.prisma.wetleaseFirstTripRate.create({
            data: {
                tenantId,
                clientAccountId: dto.clientAccountId,
                serviceCategoryId: dto.serviceCategoryId,
                firstTripClientBillAmount: new client_1.Prisma.Decimal(dto.firstTripClientBillAmount),
                firstTripPayoutVatable: new client_1.Prisma.Decimal(dto.firstTripPayoutVatable),
                effectiveStart,
                effectiveEnd,
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
            entityType: 'WETLEASE_FIRST_TRIP_RATE',
            entityId: row.id,
            changesJson: {
                serviceCategoryId: dto.serviceCategoryId,
                firstTripPayoutVatable: dto.firstTripPayoutVatable,
                effectiveStart: dto.effectiveStart,
                effectiveEnd: dto.effectiveEnd ?? null,
            },
        });
        return row;
    }
    async updateWetleaseFirstTripRate(tenantId, id, dto) {
        const existing = await this.prisma.wetleaseFirstTripRate.findFirst({
            where: { id, tenantId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Wetlease first-trip rate not found');
        }
        const effectiveStart = dto.effectiveStart
            ? new Date(dto.effectiveStart)
            : existing.effectiveStart;
        const effectiveEnd = dto.effectiveEnd !== undefined
            ? dto.effectiveEnd
                ? new Date(dto.effectiveEnd)
                : null
            : existing.effectiveEnd;
        if (effectiveEnd && effectiveEnd <= effectiveStart) {
            throw new common_1.BadRequestException('effectiveEnd must be after effectiveStart');
        }
        const endOfTime = new Date('9999-12-31');
        const overlapping = await this.prisma.wetleaseFirstTripRate.findFirst({
            where: {
                tenantId,
                clientAccountId: existing.clientAccountId,
                serviceCategoryId: existing.serviceCategoryId,
                id: { not: id },
                effectiveStart: { lte: effectiveEnd ?? endOfTime },
                OR: [{ effectiveEnd: null }, { effectiveEnd: { gte: effectiveStart } }],
            },
        });
        if (overlapping) {
            throw new common_1.ConflictException('Another wetlease first-trip rate overlaps this effective period for the same client/category');
        }
        return this.prisma.wetleaseFirstTripRate.update({
            where: { id },
            data: {
                ...(dto.firstTripClientBillAmount !== undefined && {
                    firstTripClientBillAmount: new client_1.Prisma.Decimal(dto.firstTripClientBillAmount),
                }),
                ...(dto.firstTripPayoutVatable !== undefined && {
                    firstTripPayoutVatable: new client_1.Prisma.Decimal(dto.firstTripPayoutVatable),
                }),
                ...(dto.effectiveStart !== undefined && { effectiveStart: new Date(dto.effectiveStart) }),
                ...(dto.effectiveEnd !== undefined && {
                    effectiveEnd: dto.effectiveEnd ? new Date(dto.effectiveEnd) : null,
                }),
            },
            include: {
                clientAccount: { select: { id: true, name: true, code: true } },
                serviceCategory: { select: { id: true, name: true, code: true } },
            },
        });
    }
    async assertWetleaseCategoryOrThrow(tenantId, serviceCategoryId) {
        const cat = await this.prisma.serviceCategory.findFirst({
            where: { id: serviceCategoryId, clientAccount: { tenantId } },
            select: { code: true },
        });
        if (!cat?.code || !exports.WETLEASE_CATEGORY_CODES.has(cat.code)) {
            throw new common_1.BadRequestException('Wetlease first-trip rates apply only to SPX_FM_4WCV_WETLEASE or SPX_FM_6WCV_WETLEASE categories');
        }
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
        const hasSplitRates = header.includes('client_rate') && header.includes('subcontractor_rate');
        const hasLegacyBase = header.includes('base_rate');
        if (!hasSplitRates && !hasLegacyBase) {
            throw new common_1.BadRequestException('CSV must include base_rate (legacy, same for client bill and subcontractor payout) or both client_rate and subcontractor_rate');
        }
        const requiredCols = [
            'client_code',
            'service_segment',
            'service_category_code',
            'origin_area_code',
            'destination_area_code',
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
        const idxClientRate = colIndex('client_rate');
        const idxSubcontractorRate = colIndex('subcontractor_rate');
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
            const baseRateStr = idxBaseRate >= 0 ? cols[idxBaseRate] || '' : '';
            const clientRateStr = idxClientRate >= 0 ? cols[idxClientRate] || '' : '';
            const subcontractorRateStr = idxSubcontractorRate >= 0 ? cols[idxSubcontractorRate] || '' : '';
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
            if (hasSplitRates) {
                if (!clientRateStr)
                    rowErrors.push('client_rate is required');
                if (!subcontractorRateStr)
                    rowErrors.push('subcontractor_rate is required');
            }
            else if (!baseRateStr) {
                rowErrors.push('base_rate is required');
            }
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
            let clientRate = 0;
            let subcontractorRate = 0;
            if (hasSplitRates) {
                clientRate = Number(clientRateStr);
                subcontractorRate = Number(subcontractorRateStr);
                if (!Number.isFinite(clientRate) || clientRate <= 0) {
                    rowErrors.push('client_rate must be a positive number');
                }
                if (!Number.isFinite(subcontractorRate) || subcontractorRate <= 0) {
                    rowErrors.push('subcontractor_rate must be a positive number');
                }
            }
            else {
                const baseRate = Number(baseRateStr);
                if (!Number.isFinite(baseRate) || baseRate <= 0) {
                    rowErrors.push('base_rate must be a positive number');
                }
                else {
                    clientRate = subcontractorRate = baseRate;
                }
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
                clientRate,
                subcontractorRate,
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
                                billRateAmount: new client_1.Prisma.Decimal(row.clientRate),
                                tripPayoutRateVatable: new client_1.Prisma.Decimal(row.subcontractorRate),
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
                                billRateAmount: new client_1.Prisma.Decimal(row.clientRate),
                                tripPayoutRateVatable: new client_1.Prisma.Decimal(row.subcontractorRate),
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
                                    billRateAmount: new client_1.Prisma.Decimal(row.clientRate),
                                    tripPayoutRateVatable: new client_1.Prisma.Decimal(row.subcontractorRate),
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
                                    billRateAmount: new client_1.Prisma.Decimal(row.clientRate),
                                    tripPayoutRateVatable: new client_1.Prisma.Decimal(row.subcontractorRate),
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