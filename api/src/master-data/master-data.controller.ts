import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { MasterDataService } from './master-data.service';
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

const READ_ROLES = [
  UserRole.SUPER_ADMIN,
  UserRole.ADMIN,
  UserRole.MANAGER,
  UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  UserRole.FINANCE_PERSONNEL,
  UserRole.FINANCE_MANAGER,
  UserRole.CFO,
] as const;

const WRITE_ROLES = [UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER] as const;

@ApiTags('Master Data')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('master-data')
export class MasterDataController {
  constructor(private readonly service: MasterDataService) {}

  // ——— Clients ———

  @Get('clients')
  @Roles(...READ_ROLES)
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  @ApiOperation({ summary: 'List clients with their segments and categories' })
  async listClients(@Request() req, @Query('includeInactive') includeInactive?: string) {
    return this.service.listClients(req.user.tenantId, includeInactive === 'true');
  }

  @Get('clients/:clientId')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'Get one client with segments, categories and trip requirements' })
  async getClient(@Request() req, @Param('clientId') clientId: string) {
    return this.service.getClient(req.user.tenantId, clientId);
  }

  @Post('clients')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register a client (required before any rate or AR upload using its code)',
  })
  async createClient(@Request() req, @Body() dto: CreateClientDto) {
    return this.service.createClient(req.user.id, req.user.tenantId, dto);
  }

  @Patch('clients/:clientId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a client name or status' })
  async updateClient(
    @Request() req,
    @Param('clientId') clientId: string,
    @Body() dto: UpdateClientDto,
  ) {
    return this.service.updateClient(req.user.id, req.user.tenantId, clientId, dto);
  }

  // ——— Service segments ———

  @Get('clients/:clientId/segments')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List a client service segments' })
  async listSegments(@Request() req, @Param('clientId') clientId: string) {
    return this.service.listSegments(req.user.tenantId, clientId);
  }

  @Post('clients/:clientId/segments')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a service segment to a client (e.g. FM_ONCALL)' })
  async createSegment(
    @Request() req,
    @Param('clientId') clientId: string,
    @Body() dto: CreateServiceSegmentDto,
  ) {
    return this.service.createSegment(req.user.id, req.user.tenantId, clientId, dto);
  }

  @Patch('segments/:segmentId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a service segment' })
  async updateSegment(
    @Request() req,
    @Param('segmentId') segmentId: string,
    @Body() dto: UpdateServiceSegmentDto,
  ) {
    return this.service.updateSegment(req.user.id, req.user.tenantId, segmentId, dto);
  }

  // ——— Service categories ———

  @Get('clients/:clientId/categories')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List a client service categories with their configured rules' })
  async listCategories(@Request() req, @Param('clientId') clientId: string) {
    return this.service.listCategories(req.user.tenantId, clientId);
  }

  @Post('clients/:clientId/categories')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary:
      'Add a service category under a segment, including payout terms and financial rules',
  })
  async createCategory(
    @Request() req,
    @Param('clientId') clientId: string,
    @Body() dto: CreateServiceCategoryDto,
  ) {
    return this.service.createCategory(req.user.id, req.user.tenantId, clientId, dto);
  }

  @Patch('categories/:categoryId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a service category rules (payout terms, VAT, admin fee, ...)' })
  async updateCategory(
    @Request() req,
    @Param('categoryId') categoryId: string,
    @Body() dto: UpdateServiceCategoryDto,
  ) {
    return this.service.updateCategory(req.user.id, req.user.tenantId, categoryId, dto);
  }

  // ——— Trip requirements ———

  @Get('clients/:clientId/trip-requirements')
  @Roles(...READ_ROLES)
  @ApiOperation({ summary: 'List the trip requirements that gate completion for a client' })
  async listRequirements(@Request() req, @Param('clientId') clientId: string) {
    return this.service.listRequirements(req.user.tenantId, clientId);
  }

  @Post('clients/:clientId/trip-requirements')
  @Roles(...WRITE_ROLES)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a trip requirement (e.g. POD image, seal number, waybill) for a client',
  })
  async createRequirement(
    @Request() req,
    @Param('clientId') clientId: string,
    @Body() dto: CreateTripRequirementDto,
  ) {
    return this.service.createRequirement(req.user.id, req.user.tenantId, clientId, dto);
  }

  @Patch('trip-requirements/:requirementId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Update a trip requirement' })
  async updateRequirement(
    @Request() req,
    @Param('requirementId') requirementId: string,
    @Body() dto: UpdateTripRequirementDto,
  ) {
    return this.service.updateRequirement(req.user.id, req.user.tenantId, requirementId, dto);
  }

  @Delete('trip-requirements/:requirementId')
  @Roles(...WRITE_ROLES)
  @ApiOperation({ summary: 'Delete a trip requirement that has no fulfillments yet' })
  async deleteRequirement(@Request() req, @Param('requirementId') requirementId: string) {
    return this.service.deleteRequirement(req.user.id, req.user.tenantId, requirementId);
  }
}
