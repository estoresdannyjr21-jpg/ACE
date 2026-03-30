import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateRouteRateDto,
  UpdateRouteRateDto,
  GetRouteRatesQueryDto,
  CreateWetleaseFirstTripRateDto,
  UpdateWetleaseFirstTripRateDto,
} from './dto';
import { Prisma } from '@prisma/client';

/** SPX FM wetlease: one paid first trip per driver per runsheet day; same-day extras = PHP 0 trip payout (reimbursables still apply). */
export const WETLEASE_CATEGORY_CODES: ReadonlySet<string> = new Set([
  'SPX_FM_4WCV_WETLEASE',
  'SPX_FM_6WCV_WETLEASE',
]);

/** When no DB row: client = bill to SPX; subcontractor = AP vatable base (first trip / day). */
const WETLEASE_FIRST_TRIP_FALLBACK: Record<string, { client: number; subcontractor: number }> = {
  SPX_FM_4WCV_WETLEASE: { client: 4100.0, subcontractor: 3100.0 },
  SPX_FM_6WCV_WETLEASE: { client: 4333.33, subcontractor: 3333.33 },
};

/** Interpret runsheetDate as a UTC calendar day (matches typical `YYYY-MM-DDT00:00:00.000Z` storage). */
export function utcCalendarDayBounds(d: Date): { dayStart: Date; dayEnd: Date } {
  const y = d.getUTCFullYear();
  const mObj = d.getUTCMonth();
  const day = d.getUTCDate();
  return {
    dayStart: new Date(Date.UTC(y, mObj, day, 0, 0, 0, 0)),
    dayEnd: new Date(Date.UTC(y, mObj, day, 23, 59, 59, 999)),
  };
}

@Injectable()
export class RatesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  private readonly SEGMENT_TO_CATEGORY_CODES: Record<string, string[]> = {
    FM_ONCALL: ['SPX_FM_4W_ONCALL', 'SPX_FM_6WCV_ONCALL', 'SPX_FM_10W_ONCALL'],
    FM_WETLEASE: ['SPX_FM_4WCV_WETLEASE', 'SPX_FM_6WCV_WETLEASE'],
    MFM_ONCALL: ['SPX_MEGA_FM_6W', 'SPX_MEGA_FM_10W', 'SPX_MFM_SHUNTING_6W'],
  };

  async getLookups(tenantId: string) {
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

  async createRouteRate(userId: string, tenantId: string, dto: CreateRouteRateDto) {
    await this.validateClientAndCategory(tenantId, dto.clientAccountId, dto.serviceCategoryId);

    const effectiveStart = new Date(dto.effectiveStart);
    const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('effectiveEnd must be after effectiveStart');
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
      throw new ConflictException(
        'A rate already exists for this route and overlapping effective period',
      );
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
        billRateAmount: new Prisma.Decimal(dto.billRateAmount),
        tripPayoutRateVatable: new Prisma.Decimal(dto.tripPayoutRateVatable),
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

  async getRouteRates(tenantId: string, query: GetRouteRatesQueryDto) {
    const effectiveOn = query.effectiveOn ? new Date(query.effectiveOn) : null;

    const where: Prisma.RouteRateWhereInput = {
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

  async getRouteRateById(tenantId: string, id: string) {
    const rate = await this.prisma.routeRate.findFirst({
      where: { id, tenantId },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        serviceCategory: { select: { id: true, name: true, code: true } },
      },
    });
    if (!rate) {
      throw new NotFoundException('Route rate not found');
    }
    return rate;
  }

  async updateRouteRate(tenantId: string, id: string, dto: UpdateRouteRateDto) {
    const existing = await this.prisma.routeRate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Route rate not found');
    }

    const effectiveStart = dto.effectiveStart
      ? new Date(dto.effectiveStart)
      : existing.effectiveStart;
    const effectiveEnd = dto.effectiveEnd !== undefined
      ? (dto.effectiveEnd ? new Date(dto.effectiveEnd) : null)
      : existing.effectiveEnd;
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('effectiveEnd must be after effectiveStart');
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
          billRateAmount: new Prisma.Decimal(dto.billRateAmount),
        }),
        ...(dto.tripPayoutRateVatable !== undefined && {
          tripPayoutRateVatable: new Prisma.Decimal(dto.tripPayoutRateVatable),
        }),
      },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        serviceCategory: { select: { id: true, name: true, code: true } },
      },
    });
  }

  async deleteRouteRate(tenantId: string, id: string) {
    const existing = await this.prisma.routeRate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Route rate not found');
    }
    await this.prisma.routeRate.delete({ where: { id } });
    return { deleted: true, id };
  }

  /**
   * Find the active route rate for a trip (by runsheet date and route).
   * Used by finance/compute to resolve rate for a trip.
   */
  async getActiveRateForTrip(
    tenantId: string,
    clientAccountId: string,
    serviceCategoryId: string,
    originArea: string,
    destinationArea: string,
    asOfDate: Date,
  ) {
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

  isWetleaseCategoryCode(code: string | null | undefined): boolean {
    return !!code && WETLEASE_CATEGORY_CODES.has(code);
  }

  /**
   * Active first-trip wetlease payout for `asOfDate` (usually trip.runsheetDate).
   * Falls back to code defaults if no row exists (dev / legacy DB).
   */
  async resolveWetleaseFirstTripPayoutAmount(
    tenantId: string,
    clientAccountId: string,
    serviceCategoryId: string,
    asOfDate: Date,
  ): Promise<number> {
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
    throw new BadRequestException(
      'No wetlease first-trip rate row for this category and date. Add one under GET /rates/wetlease-first-trip or seed the table.',
    );
  }

  async resolveWetleaseFirstTripClientBillAmount(
    tenantId: string,
    clientAccountId: string,
    serviceCategoryId: string,
    asOfDate: Date,
  ): Promise<number> {
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
    throw new BadRequestException(
      'No wetlease client bill amount for this category and date. Set firstTripClientBillAmount on the wetlease rate row.',
    );
  }

  async listWetleaseFirstTripRates(
    tenantId: string,
    query: { clientAccountId?: string; serviceCategoryId?: string },
  ) {
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

  async createWetleaseFirstTripRate(userId: string, tenantId: string, dto: CreateWetleaseFirstTripRateDto) {
    await this.validateClientAndCategory(tenantId, dto.clientAccountId, dto.serviceCategoryId);
    await this.assertWetleaseCategoryOrThrow(tenantId, dto.serviceCategoryId);

    const effectiveStart = new Date(dto.effectiveStart);
    const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('effectiveEnd must be after effectiveStart');
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
      throw new ConflictException(
        'A wetlease first-trip rate already exists for this client/category with an overlapping effective period',
      );
    }

    const row = await this.prisma.wetleaseFirstTripRate.create({
      data: {
        tenantId,
        clientAccountId: dto.clientAccountId,
        serviceCategoryId: dto.serviceCategoryId,
        firstTripClientBillAmount: new Prisma.Decimal(dto.firstTripClientBillAmount),
        firstTripPayoutVatable: new Prisma.Decimal(dto.firstTripPayoutVatable),
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

  async updateWetleaseFirstTripRate(
    tenantId: string,
    id: string,
    dto: UpdateWetleaseFirstTripRateDto,
  ) {
    const existing = await this.prisma.wetleaseFirstTripRate.findFirst({
      where: { id, tenantId },
    });
    if (!existing) {
      throw new NotFoundException('Wetlease first-trip rate not found');
    }

    const effectiveStart = dto.effectiveStart
      ? new Date(dto.effectiveStart)
      : existing.effectiveStart;
    const effectiveEnd =
      dto.effectiveEnd !== undefined
        ? dto.effectiveEnd
          ? new Date(dto.effectiveEnd)
          : null
        : existing.effectiveEnd;
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('effectiveEnd must be after effectiveStart');
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
      throw new ConflictException(
        'Another wetlease first-trip rate overlaps this effective period for the same client/category',
      );
    }

    return this.prisma.wetleaseFirstTripRate.update({
      where: { id },
      data: {
        ...(dto.firstTripClientBillAmount !== undefined && {
          firstTripClientBillAmount: new Prisma.Decimal(dto.firstTripClientBillAmount),
        }),
        ...(dto.firstTripPayoutVatable !== undefined && {
          firstTripPayoutVatable: new Prisma.Decimal(dto.firstTripPayoutVatable),
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

  private async assertWetleaseCategoryOrThrow(tenantId: string, serviceCategoryId: string) {
    const cat = await this.prisma.serviceCategory.findFirst({
      where: { id: serviceCategoryId, clientAccount: { tenantId } },
      select: { code: true },
    });
    if (!cat?.code || !WETLEASE_CATEGORY_CODES.has(cat.code)) {
      throw new BadRequestException(
        'Wetlease first-trip rates apply only to SPX_FM_4WCV_WETLEASE or SPX_FM_6WCV_WETLEASE categories',
      );
    }
  }

  private async validateClientAndCategory(
    tenantId: string,
    clientAccountId: string,
    serviceCategoryId: string,
  ) {
    const client = await this.prisma.clientAccount.findFirst({
      where: { id: clientAccountId, tenantId },
      include: { serviceCategories: { where: { id: serviceCategoryId } } },
    });
    if (!client) {
      throw new BadRequestException('Client account not found');
    }
    if (client.serviceCategories.length === 0) {
      throw new BadRequestException('Service category not found or not linked to this client');
    }
  }

  /**
   * Import route rates from CSV.
   * Columns (header, comma-separated):
   * client_code,service_segment,service_category_code,origin_area_code,destination_area_code,currency,effective_from,effective_to,notes
   * Plus either:
   * - **client_rate** and **subcontractor_rate** (recommended): bill to client vs pay subcontractor; or
   * - **base_rate** (legacy): same value stored as both AR and AP rates.
   * effective_to can be blank (open-ended). commit=false (default) -> preview only.
   */
  async importRatesFromCsv(params: {
    userId: string;
    tenantId: string;
    csvBuffer: Buffer;
    commit: boolean;
    mode: 'create' | 'update' | 'upsert';
  }) {
    const allowedModes: Array<'create' | 'update' | 'upsert'> = ['create', 'update', 'upsert'];
    if (!allowedModes.includes(params.mode)) {
      throw new BadRequestException(
        `Invalid mode "${params.mode}". Must be one of: ${allowedModes.join(', ')}`,
      );
    }

    const text = params.csvBuffer.toString('utf8');
    const lines = text
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    if (lines.length === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    const header = lines[0].split(',').map((h) => h.trim());
    const hasSplitRates =
      header.includes('client_rate') && header.includes('subcontractor_rate');
    const hasLegacyBase = header.includes('base_rate');
    if (!hasSplitRates && !hasLegacyBase) {
      throw new BadRequestException(
        'CSV must include base_rate (legacy, same for client bill and subcontractor payout) or both client_rate and subcontractor_rate',
      );
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
        throw new BadRequestException(`Missing required column in header: ${col}`);
      }
    }

    const colIndex = (name: string) => header.indexOf(name);
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

    type ParsedRow = {
      rowNumber: number;
      clientCode: string;
      serviceSegment: string;
      serviceCategoryCode: string;
      originArea: string;
      destinationArea: string;
      clientRate: number;
      subcontractorRate: number;
      currency: string;
      effectiveStart: Date;
      effectiveEnd: Date | null;
    };

    const parsed: ParsedRow[] = [];
    const errors: { rowNumber: number; message: string }[] = [];

    const parseDate = (value: string): Date | null => {
      if (!value) return null;
      const d = new Date(value);
      return Number.isNaN(d.getTime()) ? null : d;
    };

    for (let i = 1; i < lines.length; i++) {
      const rowNumber = i + 1; // 1-based including header
      const raw = lines[i];
      const cols = raw.split(',').map((c) => c.trim());
      if (cols.length === 1 && cols[0] === '') continue; // skip empty line

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

      const rowErrors: string[] = [];

      if (!clientCode) rowErrors.push('client_code is required');
      if (!serviceSegment) rowErrors.push('service_segment is required');
      if (!serviceCategoryCode) rowErrors.push('service_category_code is required');
      if (!originArea) rowErrors.push('origin_area_code is required');
      if (!destinationArea) rowErrors.push('destination_area_code is required');
      if (hasSplitRates) {
        if (!clientRateStr) rowErrors.push('client_rate is required');
        if (!subcontractorRateStr) rowErrors.push('subcontractor_rate is required');
      } else if (!baseRateStr) {
        rowErrors.push('base_rate is required');
      }
      if (!currency) rowErrors.push('currency is required');
      if (!effFromStr) rowErrors.push('effective_from is required');

      const allowedSegments = Object.keys(this.SEGMENT_TO_CATEGORY_CODES);
      if (serviceSegment && !allowedSegments.includes(serviceSegment)) {
        rowErrors.push(
          `service_segment must be one of ${allowedSegments.join(
            ', ',
          )}; got "${serviceSegment}"`,
        );
      }
      if (
        serviceSegment &&
        serviceCategoryCode &&
        this.SEGMENT_TO_CATEGORY_CODES[serviceSegment] &&
        !this.SEGMENT_TO_CATEGORY_CODES[serviceSegment].includes(serviceCategoryCode)
      ) {
        rowErrors.push(
          `service_category_code "${serviceCategoryCode}" does not belong to segment "${serviceSegment}"`,
        );
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
      } else {
        const baseRate = Number(baseRateStr);
        if (!Number.isFinite(baseRate) || baseRate <= 0) {
          rowErrors.push('base_rate must be a positive number');
        } else {
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
        effectiveStart: effStart!,
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

    // Resolve client and category IDs, and check overlaps.
    const createdIds: string[] = [];
    const updatedIds: string[] = [];

    const endOfTime = new Date('9999-12-31');

    const trxFn = async (tx: PrismaService) => {
      for (const row of parsed) {
        // Resolve client
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

        // Resolve service category
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

        // Check for overlapping rates (excluding exact same effectiveStart record)
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

        // Try to find existing with same key (for update)
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

        // Apply mode: 'create', 'update', or 'upsert'
        if (params.mode === 'create') {
          // Expect everything to be new; error if anything exists/overlaps
          if (existing || overlapping) {
            errors.push({
              rowNumber: row.rowNumber,
              message:
                'Create-only mode: a rate already exists or overlaps for this route and period',
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
                billRateAmount: new Prisma.Decimal(row.clientRate),
                tripPayoutRateVatable: new Prisma.Decimal(row.subcontractorRate),
              },
            });
            createdIds.push(created.id);
          }
        } else if (params.mode === 'update') {
          // Expect to update existing records only
          if (!existing) {
            errors.push({
              rowNumber: row.rowNumber,
              message:
                'Update-only mode: no existing rate found with the same client, category, route, and effective_from',
            });
            continue;
          }
          if (overlapping && overlapping.id !== existing.id) {
            errors.push({
              rowNumber: row.rowNumber,
              message:
                'Update-only mode: another rate already exists for this route and overlapping effective period',
            });
            continue;
          }
          if (params.commit) {
            const updated = await tx.routeRate.update({
              where: { id: existing.id },
              data: {
                effectiveEnd: row.effectiveEnd,
                billRateAmount: new Prisma.Decimal(row.clientRate),
                tripPayoutRateVatable: new Prisma.Decimal(row.subcontractorRate),
              },
            });
            updatedIds.push(updated.id);
          }
        } else {
          // upsert mode
          if (existing) {
            if (overlapping && overlapping.id !== existing.id) {
              errors.push({
                rowNumber: row.rowNumber,
                message:
                  'Upsert mode: a different rate already exists for this route and overlapping effective period',
              });
              continue;
            }
            if (params.commit) {
              const updated = await tx.routeRate.update({
                where: { id: existing.id },
                data: {
                  effectiveEnd: row.effectiveEnd,
                billRateAmount: new Prisma.Decimal(row.clientRate),
                tripPayoutRateVatable: new Prisma.Decimal(row.subcontractorRate),
              },
            });
            updatedIds.push(updated.id);
            }
          } else {
            if (overlapping) {
              errors.push({
                rowNumber: row.rowNumber,
                message:
                  'Upsert mode: a rate already exists for this route and overlapping effective period (no new record created).',
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
                  billRateAmount: new Prisma.Decimal(row.clientRate),
                  tripPayoutRateVatable: new Prisma.Decimal(row.subcontractorRate),
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
        // Cast tx as PrismaService-compatible for type safety
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await trxFn(tx as any);
      });

      // Audit one entry for the import as a whole (not per rate to keep noise down)
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
    } else {
      // Preview mode: do not write anything; no transaction
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

    function effEndStrPresent(value: string): boolean {
      return value !== undefined && value !== null && value.trim().length > 0;
    }
  }
}
