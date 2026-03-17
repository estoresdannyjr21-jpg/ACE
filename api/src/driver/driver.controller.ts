import { Controller, Get, Post, Body, Query, UseGuards, Request, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { DriverService } from './driver.service';
import { GetAvailabilityQueryDto, SetAvailabilityDto } from './dto/availability.dto';
import { DeclineTripDto, GetMyTripsQueryDto } from './dto/trips.dto';
import { CreateTripEventDto } from './dto/events.dto';
import { UploadPodDto } from './dto/pod.dto';
import { UploadReimbursableDocDto } from './dto/reimbursable-doc.dto';

@ApiTags('Driver App')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('driver')
export class DriverController {
  constructor(private readonly service: DriverService) {}

  @Get('availability')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my advance booking / availability tags' })
  async listMyAvailability(@Request() req, @Query() query: GetAvailabilityQueryDto) {
    return this.service.listMyAvailability({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      from: query.from,
      to: query.to,
    });
  }

  @Post('availability')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Set my availability tags in bulk (advance booking, coding day)' })
  async setMyAvailability(@Request() req, @Body() dto: SetAvailabilityDto) {
    return this.service.setMyAvailability({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      items: dto.items,
    });
  }

  @Get('trips')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'List my assigned trips' })
  async getMyTrips(@Request() req, @Query() query: GetMyTripsQueryDto) {
    return this.service.getMyTrips({
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      assignmentStatus: query.assignmentStatus,
      highLevelTripStatus: query.highLevelTripStatus,
    });
  }

  @Get('trips/:id')
  @Roles(UserRole.DRIVER)
  @ApiOperation({ summary: 'Get my trip details' })
  async getMyTrip(@Request() req, @Param('id') id: string) {
    return this.service.getMyTrip({ tenantId: req.user.tenantId, driverId: req.user.driverId, tripId: id });
  }

  @Post('trips/:id/accept')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept an assigned trip (pending acceptance only)' })
  async acceptTrip(@Request() req, @Param('id') id: string) {
    return this.service.acceptTrip({ tenantId: req.user.tenantId, driverId: req.user.driverId, tripId: id });
  }

  @Post('trips/:id/decline')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline an assigned trip (pending acceptance only)' })
  async declineTrip(@Request() req, @Param('id') id: string, @Body() dto: DeclineTripDto) {
    return this.service.declineTrip({
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      tripId: id,
      reason: dto.reason,
    });
  }

  @Post('trips/:id/events')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit a trip stop event (GPS + timestamp + photo proof)' })
  async createTripEvent(@Request() req, @Param('id') id: string, @Body() dto: CreateTripEventDto) {
    return this.service.createTripEvent({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      tripId: id,
      dto,
    });
  }

  @Post('trips/:id/pod')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Upload POD/Runsheet for a trip (sets POD status to pending review)' })
  async uploadPod(@Request() req, @Param('id') id: string, @Body() dto: UploadPodDto) {
    return this.service.uploadPod({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      tripId: id,
      fileKey: dto.fileKey,
    });
  }

  @Post('trips/:id/reimbursable-doc')
  @Roles(UserRole.DRIVER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Upload wetlease reimbursable doc (TOLL, GAS, or PARKING)' })
  async uploadReimbursableDoc(@Request() req, @Param('id') id: string, @Body() dto: UploadReimbursableDocDto) {
    return this.service.uploadReimbursableDoc({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      driverId: req.user.driverId,
      tripId: id,
      docType: dto.docType,
      fileKey: dto.fileKey,
    });
  }
}

