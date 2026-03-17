import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { FleetInventoryService } from './fleet-inventory.service';
import {
  CreateFleetInventoryDto,
  UpdateFleetInventoryDto,
  GetFleetInventoryQueryDto,
} from './dto/fleet-inventory.dto';

@ApiTags('Fleet Acquisition - Fleet Inventory')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('fleet-acquisition/fleet-inventory')
export class FleetInventoryController {
  constructor(private readonly service: FleetInventoryService) {}

  @Post()
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Tag vehicle for client (PRIMARY/SECONDARY)' })
  async create(@Request() req, @Body() dto: CreateFleetInventoryDto) {
    return this.service.create(req.user.tenantId, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FLEET_ACQUISITION,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @ApiOperation({ summary: 'List fleet inventory with optional filters' })
  async findMany(@Request() req, @Query() query: GetFleetInventoryQueryDto) {
    return this.service.findMany(req.user.tenantId, query);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FLEET_ACQUISITION,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @ApiOperation({ summary: 'Get fleet inventory entry by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @ApiOperation({ summary: 'Update effective end or status' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateFleetInventoryDto,
  ) {
    return this.service.update(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FLEET_ACQUISITION)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove fleet inventory entry' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(req.user.tenantId, id);
  }
}
