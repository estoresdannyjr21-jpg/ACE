import {
  Controller,
  Get,
  Post,
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
import { IncidentsService } from './incidents.service';
import {
  GetIncidentsQueryDto,
  CreateIncidentDto,
  AddIncidentUpdateDto,
  ResolveIncidentDto,
  AddIncidentMediaDto,
} from './dto';

@ApiTags('Incidents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('incidents')
export class IncidentsController {
  constructor(private readonly service: IncidentsService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'List incidents with optional filters' })
  async findAll(@Request() req, @Query() query: GetIncidentsQueryDto) {
    return this.service.findMany(req.user.tenantId, query);
  }

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.DRIVER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Report trip incident' })
  async create(@Request() req, @Body() dto: CreateIncidentDto) {
    return this.service.create(req.user.id, req.user.tenantId, dto);
  }

  @Get('trip/:tripId')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
    UserRole.DRIVER,
  )
  @ApiOperation({ summary: 'List incidents for a trip' })
  async findByTrip(@Request() req, @Param('tripId') tripId: string) {
    return this.service.findByTrip(req.user.tenantId, tripId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
    UserRole.DRIVER,
  )
  @ApiOperation({ summary: 'Get incident by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(req.user.tenantId, id);
  }

  @Post(':id/updates')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add status/comment update to incident' })
  async addUpdate(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AddIncidentUpdateDto,
  ) {
    return this.service.addUpdate(req.user.id, req.user.tenantId, id, dto);
  }

  @Post(':id/resolve')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve incident (with optional replacement trip)' })
  async resolve(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: ResolveIncidentDto,
  ) {
    return this.service.resolve(req.user.id, req.user.tenantId, id, dto);
  }

  @Post(':id/close')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Close resolved incident' })
  async close(@Request() req, @Param('id') id: string) {
    return this.service.close(req.user.tenantId, id);
  }

  @Post(':id/media')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.DRIVER,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Attach media to incident (provide fileKey after upload)' })
  async addMedia(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AddIncidentMediaDto,
  ) {
    return this.service.addMedia(req.user.tenantId, id, dto);
  }
}
