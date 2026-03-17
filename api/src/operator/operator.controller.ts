import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  Res,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { OperatorService } from './operator.service';
import { UploadService } from '../upload/upload.service';

@ApiTags('Operator Portal')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('operator')
export class OperatorController {
  constructor(
    private readonly service: OperatorService,
    private readonly upload: UploadService,
  ) {}

  @Get('trips')
  @Roles(UserRole.OPERATOR_USER)
  @ApiOperation({ summary: 'List trips for the operator user' })
  async getTrips(@Request() req, @Query() query: any) {
    return this.service.getTrips(req.user.tenantId, req.user.operatorId, query);
  }

  @Get('payout-batches')
  @Roles(UserRole.OPERATOR_USER)
  @ApiOperation({ summary: 'List payout batches for the operator user' })
  async getPayoutBatches(@Request() req) {
    return this.service.getPayoutBatches(req.user.tenantId, req.user.operatorId);
  }

  @Get('payout-batches/:id')
  @Roles(UserRole.OPERATOR_USER)
  @ApiOperation({ summary: 'Get payout batch (includes payslipFileKey once CFO approved)' })
  async getPayoutBatch(@Request() req, @Param('id') id: string) {
    return this.service.getPayoutBatch(req.user.tenantId, req.user.operatorId, id);
  }

  @Get('payout-batches/:id/payslip')
  @Roles(UserRole.OPERATOR_USER)
  @ApiOperation({ summary: 'Download payslip PDF (only for CFO-approved batches)' })
  async getPayslip(@Request() req, @Param('id') id: string, @Res() res: Response) {
    const batch = await this.service.getPayoutBatch(req.user.tenantId, req.user.operatorId, id);
    if (!batch.payslipFileKey) {
      throw new NotFoundException('Payslip not yet available for this batch');
    }
    const filePath = this.upload.getFilePath(batch.payslipFileKey);
    res.setHeader('Content-Type', 'application/pdf');
    res.sendFile(filePath);
  }
}

