import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { FleetAcquisitionService } from './fleet-acquisition.service';
import { CreateOperatorDto, CreateDriverDto, CreateVehicleDto, UpdateOperatorInvoiceTypeDto } from './dto';

@ApiTags('Fleet Acquisition')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet-acquisition')
export class FleetAcquisitionController {
  constructor(private service: FleetAcquisitionService) {}

  @Post('operators')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create operator' })
  async createOperator(@Request() req, @Body() dto: CreateOperatorDto) {
    return this.service.createOperator(req.user.id, req.user.tenantId, dto);
  }

  @Get('operators')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @ApiOperation({ summary: 'Get all operators (bank details masked for Fleet Acquisition role)' })
  async getOperators(@Request() req) {
    const canSeeBankDetails = [
      UserRole.SUPER_ADMIN,
      UserRole.ADMIN,
      UserRole.MANAGER,
      UserRole.FINANCE_PERSONNEL,
      UserRole.FINANCE_MANAGER,
      UserRole.CFO,
    ].includes(req.user.role);
    return this.service.getOperators(req.user.tenantId, {
      maskBankDetails: !canSeeBankDetails,
    });
  }

  @Patch('operators/:id/invoice-type')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update operator invoice type (Admin/Manager only)' })
  async updateOperatorInvoiceType(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateOperatorInvoiceTypeDto,
  ) {
    return this.service.updateOperatorInvoiceType(req.user.id, req.user.tenantId, id, dto.invoiceType);
  }

  @Post('drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create driver' })
  async createDriver(@Request() req, @Body() dto: CreateDriverDto) {
    return this.service.createDriver(req.user.id, req.user.tenantId, dto);
  }

  @Get('drivers')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @ApiOperation({ summary: 'Get all drivers' })
  async getDrivers(@Request() req) {
    return this.service.getDrivers(req.user.tenantId);
  }

  @Post('vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create vehicle' })
  async createVehicle(@Request() req, @Body() dto: CreateVehicleDto) {
    return this.service.createVehicle(req.user.id, req.user.tenantId, dto);
  }

  @Get('vehicles')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @ApiOperation({ summary: 'Get all vehicles' })
  async getVehicles(@Request() req) {
    return this.service.getVehicles(req.user.tenantId);
  }
}
