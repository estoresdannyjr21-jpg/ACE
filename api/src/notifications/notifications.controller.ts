import { Controller, Get, Post, Param, Body, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/rbac.guard';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceDto, UnregisterDeviceDto } from './dto/register-device.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly service: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List my notifications' })
  async list(@Request() req) {
    return this.service.list(req.user.id);
  }

  @Post(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Request() req, @Param('id') id: string) {
    return this.service.markRead(req.user.id, id);
  }

  @Post('register-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register FCM device token for push notifications' })
  async registerDevice(@Request() req, @Body() dto: RegisterDeviceDto) {
    return this.service.registerDevice(req.user.id, dto.token, dto.deviceId);
  }

  @Post('unregister-device')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove FCM device token' })
  async unregisterDevice(@Request() req, @Body() dto: UnregisterDeviceDto) {
    return this.service.unregisterDevice(req.user.id, dto.token);
  }
}

