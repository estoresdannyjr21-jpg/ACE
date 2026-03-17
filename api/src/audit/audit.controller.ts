import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { AuditService } from './audit.service';
import { GetAuditLogsQueryDto } from './dto';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('audit-logs')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'List audit logs with optional filters' })
  async findMany(@Request() req, @Query() query: GetAuditLogsQueryDto) {
    return this.service.findMany(req.user.tenantId, query);
  }
}
