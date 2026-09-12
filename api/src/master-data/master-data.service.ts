import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TripRequirementKind } from '@prisma/client';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateClientDto,
  CreateServiceCategoryDto,
  CreateServiceSegmentDto,
  CreateTripRequirementDto,
  UpdateClientDto,
  UpdateServiceCategoryDto,
  UpdateServiceSegmentDto,
  UpdateTripRequirementDto,
} from './dto';

/**
 * Master data for onboarding clients: Client -> ServiceSegment -> ServiceCategory,
 * plus the per-client trip requirements that gate trip completion.
 */
@Injectable()
export class MasterDataService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ——— Clients ———

  async listClients(tenantId: string, includeInactive = false) {
    return this.prisma.client.findMany({
      where: { tenantId, ...(includeInactive ? {} : { status: 'ACTIVE' }) },
      include: {
        serviceSegments: {
          orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
          include: { serviceCategories: { orderBy: { code: 'asc' } } },
        },
        _count: { select: { tripRequirements: true, trips: true, routeRates: true } },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getClient(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      include: {
        serviceSegments: {
          orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
          include: { serviceCategories: { orderBy: { code: 'asc' } } },
        },
        tripRequirements: { orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }] },
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  async createClient(userId: string, tenantId: string, dto: CreateClientDto) {
    const existing = await this.prisma.client.findFirst({
      where: { tenantId, code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Client code "${dto.code}" already exists for this tenant`);
    }

    const client = await this.prisma.client.create({
      data: {
        tenantId,
        name: dto.name,
        code: dto.code,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'CLIENT',
      entityId: client.id,
      changesJson: { name: dto.name, code: dto.code },
    });

    return client;
  }

  async updateClient(userId: string, tenantId: string, clientId: string, dto: UpdateClientDto) {
    await this.assertClient(tenantId, clientId);
    const client = await this.prisma.client.update({
      where: { id: clientId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'CLIENT',
      entityId: clientId,
      changesJson: { ...dto },
    });

    return client;
  }

  // ——— Service segments ———

  async listSegments(tenantId: string, clientId: string) {
    await this.assertClient(tenantId, clientId);
    return this.prisma.serviceSegment.findMany({
      where: { clientAccountId: clientId },
      include: { serviceCategories: { orderBy: { code: 'asc' } } },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async createSegment(
    userId: string,
    tenantId: string,
    clientId: string,
    dto: CreateServiceSegmentDto,
  ) {
    await this.assertClient(tenantId, clientId);
    const existing = await this.prisma.serviceSegment.findFirst({
      where: { clientAccountId: clientId, code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Segment code "${dto.code}" already exists for this client`);
    }

    const segment = await this.prisma.serviceSegment.create({
      data: {
        clientAccountId: clientId,
        name: dto.name,
        code: dto.code,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'SERVICE_SEGMENT',
      entityId: segment.id,
      changesJson: { clientAccountId: clientId, code: dto.code },
    });

    return segment;
  }

  async updateSegment(
    userId: string,
    tenantId: string,
    segmentId: string,
    dto: UpdateServiceSegmentDto,
  ) {
    const existing = await this.prisma.serviceSegment.findFirst({
      where: { id: segmentId, client: { tenantId } },
    });
    if (!existing) throw new NotFoundException('Service segment not found');

    const segment = await this.prisma.serviceSegment.update({
      where: { id: segmentId },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'SERVICE_SEGMENT',
      entityId: segmentId,
      changesJson: { ...dto },
    });

    return segment;
  }

  // ——— Service categories ———

  async listCategories(tenantId: string, clientId: string) {
    await this.assertClient(tenantId, clientId);
    return this.prisma.serviceCategory.findMany({
      where: { clientAccountId: clientId },
      include: { serviceSegment: { select: { id: true, code: true, name: true } } },
      orderBy: { code: 'asc' },
    });
  }

  async createCategory(
    userId: string,
    tenantId: string,
    clientId: string,
    dto: CreateServiceCategoryDto,
  ) {
    await this.assertClient(tenantId, clientId);
    const segment = await this.prisma.serviceSegment.findFirst({
      where: { id: dto.serviceSegmentId, clientAccountId: clientId },
      select: { id: true },
    });
    if (!segment) {
      throw new BadRequestException('Service segment not found for this client');
    }
    const existing = await this.prisma.serviceCategory.findFirst({
      where: { clientAccountId: clientId, code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Category code "${dto.code}" already exists for this client`);
    }

    const category = await this.prisma.serviceCategory.create({
      data: {
        clientAccountId: clientId,
        serviceSegmentId: segment.id,
        name: dto.name,
        code: dto.code,
        status: dto.status ?? 'ACTIVE',
        ...this.ruleData(dto),
      },
      include: { serviceSegment: { select: { id: true, code: true, name: true } } },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'SERVICE_CATEGORY',
      entityId: category.id,
      changesJson: { clientAccountId: clientId, code: dto.code, ...this.ruleAuditData(dto) },
    });

    return category;
  }

  async updateCategory(
    userId: string,
    tenantId: string,
    categoryId: string,
    dto: UpdateServiceCategoryDto,
  ) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: { id: categoryId, clientAccount: { tenantId } },
    });
    if (!existing) throw new NotFoundException('Service category not found');

    if (dto.serviceSegmentId) {
      const segment = await this.prisma.serviceSegment.findFirst({
        where: { id: dto.serviceSegmentId, clientAccountId: existing.clientAccountId },
        select: { id: true },
      });
      if (!segment) {
        throw new BadRequestException('Service segment not found for this client');
      }
    }

    const category = await this.prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        ...(dto.serviceSegmentId !== undefined && { serviceSegmentId: dto.serviceSegmentId }),
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...this.ruleData(dto),
      },
      include: { serviceSegment: { select: { id: true, code: true, name: true } } },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'SERVICE_CATEGORY',
      entityId: categoryId,
      changesJson: { ...dto },
    });

    return category;
  }

  // ——— Trip requirements ———

  async listRequirements(tenantId: string, clientId: string) {
    await this.assertClient(tenantId, clientId);
    return this.prisma.clientTripRequirement.findMany({
      where: { clientAccountId: clientId },
      include: { serviceCategory: { select: { id: true, code: true, name: true } } },
      orderBy: [{ sortOrder: 'asc' }, { code: 'asc' }],
    });
  }

  async createRequirement(
    userId: string,
    tenantId: string,
    clientId: string,
    dto: CreateTripRequirementDto,
  ) {
    await this.assertClient(tenantId, clientId);
    this.assertRequirementShape(dto.kind, dto.docType);

    if (dto.serviceCategoryId) {
      const category = await this.prisma.serviceCategory.findFirst({
        where: { id: dto.serviceCategoryId, clientAccountId: clientId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException('Service category not found for this client');
      }
    }

    const existing = await this.prisma.clientTripRequirement.findFirst({
      where: { clientAccountId: clientId, code: dto.code },
      select: { id: true },
    });
    if (existing) {
      throw new ConflictException(`Requirement code "${dto.code}" already exists for this client`);
    }

    const requirement = await this.prisma.clientTripRequirement.create({
      data: {
        tenantId,
        clientAccountId: clientId,
        serviceCategoryId: dto.serviceCategoryId ?? null,
        code: dto.code,
        label: dto.label,
        kind: dto.kind,
        docType: dto.docType ?? null,
        required: dto.required ?? true,
        sortOrder: dto.sortOrder ?? 0,
        status: dto.status ?? 'ACTIVE',
        helpText: dto.helpText ?? null,
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'CREATE',
      entityType: 'CLIENT_TRIP_REQUIREMENT',
      entityId: requirement.id,
      changesJson: { clientAccountId: clientId, code: dto.code, kind: dto.kind },
    });

    return requirement;
  }

  async updateRequirement(
    userId: string,
    tenantId: string,
    requirementId: string,
    dto: UpdateTripRequirementDto,
  ) {
    const existing = await this.prisma.clientTripRequirement.findFirst({
      where: { id: requirementId, tenantId },
    });
    if (!existing) throw new NotFoundException('Trip requirement not found');

    const kind = dto.kind ?? existing.kind;
    const docType = dto.docType !== undefined ? dto.docType : existing.docType;
    this.assertRequirementShape(kind, docType);

    if (dto.serviceCategoryId) {
      const category = await this.prisma.serviceCategory.findFirst({
        where: { id: dto.serviceCategoryId, clientAccountId: existing.clientAccountId },
        select: { id: true },
      });
      if (!category) {
        throw new BadRequestException('Service category not found for this client');
      }
    }

    const requirement = await this.prisma.clientTripRequirement.update({
      where: { id: requirementId },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.kind !== undefined && { kind: dto.kind }),
        ...(dto.docType !== undefined && { docType: dto.docType }),
        ...(dto.serviceCategoryId !== undefined && {
          serviceCategoryId: dto.serviceCategoryId || null,
        }),
        ...(dto.required !== undefined && { required: dto.required }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        ...(dto.status !== undefined && { status: dto.status }),
        ...(dto.helpText !== undefined && { helpText: dto.helpText }),
      },
    });

    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'CLIENT_TRIP_REQUIREMENT',
      entityId: requirementId,
      changesJson: { ...dto },
    });

    return requirement;
  }

  async deleteRequirement(userId: string, tenantId: string, requirementId: string) {
    const existing = await this.prisma.clientTripRequirement.findFirst({
      where: { id: requirementId, tenantId },
      include: { _count: { select: { fulfillments: true } } },
    });
    if (!existing) throw new NotFoundException('Trip requirement not found');
    if (existing._count.fulfillments > 0) {
      throw new ConflictException(
        'Requirement already has fulfillments on trips; set status to INACTIVE instead of deleting',
      );
    }

    await this.prisma.clientTripRequirement.delete({ where: { id: requirementId } });
    await this.audit.log({
      tenantId,
      userId,
      action: 'DELETE',
      entityType: 'CLIENT_TRIP_REQUIREMENT',
      entityId: requirementId,
      changesJson: { code: existing.code },
    });
    return { deleted: true, id: requirementId };
  }

  private assertRequirementShape(kind: TripRequirementKind, docType?: unknown) {
    if (kind === TripRequirementKind.DOCUMENT && !docType) {
      throw new BadRequestException('docType is required for DOCUMENT requirements');
    }
  }

  private async assertClient(tenantId: string, clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { id: clientId, tenantId },
      select: { id: true },
    });
    if (!client) throw new NotFoundException('Client not found');
    return client;
  }

  private ruleData(dto: Partial<CreateServiceCategoryDto>) {
    return {
      ...(dto.payoutTermsBusinessDays !== undefined && {
        payoutTermsBusinessDays: dto.payoutTermsBusinessDays,
      }),
      ...(dto.docSubmissionDay !== undefined && { docSubmissionDay: dto.docSubmissionDay }),
      ...(dto.cycleStartDay !== undefined && { cycleStartDay: dto.cycleStartDay }),
      ...(dto.excludeWeekends !== undefined && { excludeWeekends: dto.excludeWeekends }),
      ...(dto.subcontractorInvoiceDeadlineDays !== undefined && {
        subcontractorInvoiceDeadlineDays: dto.subcontractorInvoiceDeadlineDays,
      }),
      ...(dto.callTimeGraceMinutes !== undefined && {
        callTimeGraceMinutes: dto.callTimeGraceMinutes,
      }),
      ...(dto.vatRate !== undefined && { vatRate: new Prisma.Decimal(dto.vatRate) }),
      ...(dto.adminFeePercent !== undefined && {
        adminFeePercent: new Prisma.Decimal(dto.adminFeePercent),
      }),
      ...(dto.withholdingPercent !== undefined && {
        withholdingPercent: new Prisma.Decimal(dto.withholdingPercent),
      }),
      ...(dto.firstTripOnlyPayout !== undefined && {
        firstTripOnlyPayout: dto.firstTripOnlyPayout,
      }),
    };
  }

  private ruleAuditData(dto: Partial<CreateServiceCategoryDto>) {
    return {
      payoutTermsBusinessDays: dto.payoutTermsBusinessDays ?? null,
      firstTripOnlyPayout: dto.firstTripOnlyPayout ?? false,
    };
  }
}
