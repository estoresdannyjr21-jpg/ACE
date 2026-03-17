import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { InvoiceType } from '@prisma/client';
import { CreateOperatorDto, CreateDriverDto, CreateVehicleDto } from './dto';

@Injectable()
export class FleetAcquisitionService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // Operators
  async createOperator(userId: string, tenantId: string, dto: CreateOperatorDto) {
    return this.prisma.operator.create({
      data: {
        tenantId,
        name: dto.name,
        contactName: dto.contactName,
        email: dto.email,
        phone: dto.phone,
        address: dto.address,
        taxId: dto.taxId,
        invoiceType: dto.invoiceType || 'VATABLE',
        bankName: dto.bankName,
        bankAccount: dto.bankAccount,
        bankBranch: dto.bankBranch,
        status: 'ACTIVE',
      },
    });
  }

  /** Mask bank fields for responses when caller should not see full bank details. */
  private maskOperatorBankDetails<T extends { bankName?: string | null; bankAccount?: string | null; bankBranch?: string | null }>(
    operators: T[],
  ): T[] {
    return operators.map((op) => ({
      ...op,
      bankName: op.bankName ? '***' : null,
      bankAccount: op.bankAccount ? `****${String(op.bankAccount).slice(-4)}` : null,
      bankBranch: op.bankBranch ? '***' : null,
    }));
  }

  async getOperators(tenantId: string, options?: { maskBankDetails?: boolean }) {
    const list = await this.prisma.operator.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
    if (options?.maskBankDetails) {
      return this.maskOperatorBankDetails(list);
    }
    return list;
  }

  async updateOperatorInvoiceType(
    userId: string,
    tenantId: string,
    operatorId: string,
    invoiceType: InvoiceType,
  ) {
    const op = await this.prisma.operator.findFirst({
      where: { id: operatorId, tenantId },
    });
    if (!op) {
      throw new NotFoundException('Operator not found');
    }
    const updated = await this.prisma.operator.update({
      where: { id: operatorId },
      data: { invoiceType },
    });
    await this.audit.log({
      tenantId,
      userId,
      action: 'UPDATE',
      entityType: 'OPERATOR_INVOICE_TYPE',
      entityId: operatorId,
      changesJson: { invoiceType },
    });
    return updated;
  }

  // Drivers
  async createDriver(userId: string, tenantId: string, dto: CreateDriverDto) {
    // Check if operator assignment exists
    if (dto.operatorId && dto.assignmentStartDate) {
      const operator = await this.prisma.operator.findUnique({
        where: { id: dto.operatorId },
      });
      if (!operator) {
        throw new NotFoundException('Operator not found');
      }
    }

    const driver = await this.prisma.driver.create({
      data: {
        tenantId,
        spxDriverId: dto.spxDriverId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        email: dto.email,
        licenseNumber: dto.licenseNumber,
        status: 'ACTIVE',
      },
    });

    // Create assignment if provided
    if (dto.operatorId && dto.assignmentStartDate) {
      await this.prisma.driverOperatorAssignment.create({
        data: {
          driverId: driver.id,
          operatorId: dto.operatorId,
          startDate: new Date(dto.assignmentStartDate),
        },
      });
    }

    return driver;
  }

  async getDrivers(tenantId: string) {
    return this.prisma.driver.findMany({
      where: { tenantId },
      include: {
        assignments: {
          where: { endDate: null },
          include: { operator: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Vehicles
  async createVehicle(userId: string, tenantId: string, dto: CreateVehicleDto) {
    // Check if operator assignment exists
    if (dto.operatorId && dto.assignmentStartDate) {
      const operator = await this.prisma.operator.findUnique({
        where: { id: dto.operatorId },
      });
      if (!operator) {
        throw new NotFoundException('Operator not found');
      }
    }

    const vehicle = await this.prisma.vehicle.create({
      data: {
        tenantId,
        plateNumber: dto.plateNumber,
        vehicleType: dto.vehicleType,
        bodyType: dto.bodyType,
        status: 'ACTIVE',
      },
    });

    // Create assignment if provided
    if (dto.operatorId && dto.assignmentStartDate) {
      await this.prisma.vehicleOperatorAssignment.create({
        data: {
          vehicleId: vehicle.id,
          operatorId: dto.operatorId,
          startDate: new Date(dto.assignmentStartDate),
        },
      });
    }

    return vehicle;
  }

  async getVehicles(tenantId: string) {
    return this.prisma.vehicle.findMany({
      where: { tenantId },
      include: {
        assignments: {
          where: { endDate: null },
          include: { operator: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
