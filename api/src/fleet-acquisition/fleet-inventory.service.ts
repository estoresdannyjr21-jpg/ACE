import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateFleetInventoryDto,
  UpdateFleetInventoryDto,
  GetFleetInventoryQueryDto,
} from './dto/fleet-inventory.dto';

@Injectable()
export class FleetInventoryService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateFleetInventoryDto) {
    const client = await this.prisma.clientAccount.findFirst({
      where: { id: dto.clientAccountId, tenantId },
    });
    if (!client) {
      throw new NotFoundException('Client account not found');
    }
    const vehicle = await this.prisma.vehicle.findFirst({
      where: { id: dto.vehicleId, tenantId },
    });
    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }
    const effectiveStart = new Date(dto.effectiveStart);
    const effectiveEnd = dto.effectiveEnd ? new Date(dto.effectiveEnd) : null;
    if (effectiveEnd && effectiveEnd <= effectiveStart) {
      throw new BadRequestException('effectiveEnd must be after effectiveStart');
    }
    return this.prisma.fleetInventory.create({
      data: {
        clientAccountId: dto.clientAccountId,
        vehicleId: dto.vehicleId,
        tagType: dto.tagType,
        effectiveStart,
        effectiveEnd,
      },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
      },
    });
  }

  async findMany(tenantId: string, query: GetFleetInventoryQueryDto) {
    const effectiveOn = query.effectiveOn ? new Date(query.effectiveOn) : null;
    const where: Prisma.FleetInventoryWhereInput = {
      clientAccount: { tenantId },
      ...(query.clientAccountId && { clientAccountId: query.clientAccountId }),
      ...(query.vehicleId && { vehicleId: query.vehicleId }),
      ...(effectiveOn && {
        effectiveStart: { lte: effectiveOn },
        OR: [
          { effectiveEnd: null },
          { effectiveEnd: { gte: effectiveOn } },
        ],
      }),
    };
    return this.prisma.fleetInventory.findMany({
      where,
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
      },
      orderBy: [{ effectiveStart: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(tenantId: string, id: string) {
    const entry = await this.prisma.fleetInventory.findFirst({
      where: { id, clientAccount: { tenantId } },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        vehicle: { select: { id: true, plateNumber: true, vehicleType: true } },
      },
    });
    if (!entry) {
      throw new NotFoundException('Fleet inventory entry not found');
    }
    return entry;
  }

  async update(tenantId: string, id: string, dto: UpdateFleetInventoryDto) {
    await this.findOne(tenantId, id);
    return this.prisma.fleetInventory.update({
      where: { id },
      data: {
        ...(dto.effectiveEnd !== undefined && {
          effectiveEnd: dto.effectiveEnd ? new Date(dto.effectiveEnd) : null,
        }),
        ...(dto.status !== undefined && { status: dto.status }),
      },
      include: {
        clientAccount: { select: { id: true, name: true } },
        vehicle: { select: { id: true, plateNumber: true } },
      },
    });
  }

  async remove(tenantId: string, id: string) {
    await this.findOne(tenantId, id);
    await this.prisma.fleetInventory.delete({ where: { id } });
    return { deleted: true, id };
  }
}
