import {
  Controller,
  Get,
  Post,
  Put,
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
import { DispatchService } from './dispatch.service';
import { CreateTripDto, VerifyPODDto, RejectPODDto, GetTripsQueryDto } from './dto';
import { DriverAvailabilityQueryDto } from './dto/availability-query.dto';
import { OperationsDashboardQueryDto } from './dto/operations-dashboard.dto';
import {
  ProxyCreateIncidentDto,
  ProxyIncidentResolveDto,
  ProxyIncidentUpdateDto,
  ProxyPodUploadDto,
  ProxyReimbursableDocDto,
  ProxyTripEventDto,
} from './dto/proxy-update.dto';

@ApiTags('Dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private service: DispatchService) {}

  @Get('search')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Global search: trips (internal ref), drivers (name), operators (name)' })
  async search(@Request() req, @Query('q') q?: string) {
    return this.service.search(req.user.tenantId, q ?? '');
  }

  @Get('lookups')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.OPERATIONS_ACCOUNT_COORDINATOR,
  )
  @ApiOperation({ summary: 'Get lookup data for Dispatch create trip UI' })
  async lookups(@Request() req) {
    return this.service.getLookups(req.user.tenantId);
  }

  @Post('trips')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create trip (requires active route rate for trip date; returns trip and rateExpiryWarning if rate ends within 7 days)' })
  async createTrip(@Request() req, @Body() dto: CreateTripDto) {
    return this.service.createTrip(req.user.id, req.user.tenantId, dto);
  }

  @Get('trips')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR, UserRole.FINANCE_PERSONNEL, UserRole.FINANCE_MANAGER, UserRole.CFO)
  @ApiOperation({ summary: 'Get trips' })
  async getTrips(@Request() req, @Query() query: GetTripsQueryDto) {
    return this.service.getTrips(req.user.tenantId, query);
  }

  @Get('driver-availability')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @ApiOperation({ summary: 'View driver availability (advance booking / coding day) for planning' })
  async getDriverAvailability(@Request() req, @Query() query: DriverAvailabilityQueryDto) {
    return this.service.getDriverAvailability(req.user.tenantId, query);
  }

  @Get('dashboard/operations')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @ApiOperation({ summary: 'Operations dashboard: counts and lists (pending acceptance, POD, no-update, incidents)' })
  async getOperationsDashboard(@Request() req, @Query() query: OperationsDashboardQueryDto) {
    return this.service.getOperationsDashboard(req.user.tenantId, query);
  }

  @Get('trips/:id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR, UserRole.FINANCE_PERSONNEL, UserRole.FINANCE_MANAGER, UserRole.CFO)
  @ApiOperation({ summary: 'Get trip by ID' })
  async getTripById(@Request() req, @Param('id') tripId: string) {
    return this.service.getTripById(req.user.tenantId, tripId);
  }

  @Put('trips/:id/pod/verify')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @ApiOperation({ summary: 'Verify POD' })
  async verifyPOD(@Request() req, @Param('id') tripId: string, @Body() dto: VerifyPODDto) {
    return this.service.verifyPOD(req.user.id, req.user.tenantId, tripId, dto);
  }

  @Put('trips/:id/pod/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @ApiOperation({ summary: 'Reject POD' })
  async rejectPOD(@Request() req, @Param('id') tripId: string, @Body() dto: RejectPODDto) {
    return this.service.rejectPOD(req.user.id, req.user.tenantId, tripId, dto);
  }

  @Post('trips/:id/proxy/events')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Encode a driver trip event on behalf of driver (manual override)' })
  async proxyTripEvent(@Request() req, @Param('id') tripId: string, @Body() dto: ProxyTripEventDto) {
    return this.service.proxyCreateTripEvent({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      tripId,
      dto,
    });
  }

  @Post('trips/:id/proxy/pod')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload POD/Runsheet on behalf of driver (manual override)' })
  async proxyPodUpload(@Request() req, @Param('id') tripId: string, @Body() dto: ProxyPodUploadDto) {
    return this.service.proxyUploadPod({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      tripId,
      dto,
    });
  }

  @Post('trips/:id/proxy/reimbursable-doc')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload TOLL/GAS/PARKING doc on behalf of driver (manual override)' })
  async proxyReimbursableDoc(@Request() req, @Param('id') tripId: string, @Body() dto: ProxyReimbursableDocDto) {
    return this.service.proxyUploadReimbursableDoc({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      tripId,
      dto,
    });
  }

  @Post('trips/:id/proxy/incidents')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create incident on behalf of driver (manual override)' })
  async proxyCreateIncident(@Request() req, @Param('id') tripId: string, @Body() dto: ProxyCreateIncidentDto) {
    return this.service.proxyCreateIncident({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      tripId,
      dto,
    });
  }

  @Post('incidents/:id/proxy/update')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Add incident update on behalf of driver (manual override)' })
  async proxyIncidentUpdate(@Request() req, @Param('id') incidentId: string, @Body() dto: ProxyIncidentUpdateDto) {
    return this.service.proxyIncidentUpdate({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      incidentId,
      dto,
    });
  }

  @Post('incidents/:id/proxy/resolve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.OPERATIONS_ACCOUNT_COORDINATOR)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resolve incident on behalf of driver (manual override)' })
  async proxyIncidentResolve(@Request() req, @Param('id') incidentId: string, @Body() dto: ProxyIncidentResolveDto) {
    return this.service.proxyIncidentResolve({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      incidentId,
      dto,
    });
  }
}
