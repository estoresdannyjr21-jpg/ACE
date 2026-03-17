import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class OperatorService {
  constructor(private prisma: PrismaService) {}

  async getTrips(tenantId: string, operatorId: string | null | undefined, query: any) {
    if (!operatorId) {
      throw new ForbiddenException('Operator user is not linked to an operator');
    }
    const where: Prisma.TripWhereInput = {
      tenantId,
      operatorIdAtAssignment: operatorId,
      ...(query?.from && query?.to
        ? { runsheetDate: { gte: new Date(query.from), lte: new Date(query.to) } }
        : {}),
    };
    return this.prisma.trip.findMany({
      where,
      include: {
        serviceCategory: true,
        assignedDriver: true,
        assignedVehicle: true,
        finance: true,
      },
      orderBy: { runsheetDate: 'desc' },
      take: 200,
    });
  }

  async getPayoutBatches(tenantId: string, operatorId: string | null | undefined) {
    if (!operatorId) {
      throw new ForbiddenException('Operator user is not linked to an operator');
    }
    return this.prisma.payoutBatch.findMany({
      where: { tenantId, operatorId },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        _count: { select: { trips: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }

  async getPayoutBatch(tenantId: string, operatorId: string | null | undefined, batchId: string) {
    if (!operatorId) {
      throw new ForbiddenException('Operator user is not linked to an operator');
    }
    const batch = await this.prisma.payoutBatch.findFirst({
      where: { id: batchId, tenantId, operatorId },
      include: {
        clientAccount: { select: { id: true, name: true, code: true } },
        trips: {
          include: {
            trip: {
              select: {
                id: true,
                internalRef: true,
                runsheetDate: true,
                originArea: true,
                destinationArea: true,
              },
            },
          },
        },
      },
    });
    if (!batch) {
      throw new NotFoundException('Payout batch not found');
    }
    return batch;
  }
}

