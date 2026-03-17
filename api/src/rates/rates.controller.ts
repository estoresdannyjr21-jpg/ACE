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
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard, Roles } from '../common/guards/rbac.guard';
import { UserRole } from '@prisma/client';
import { RatesService } from './rates.service';
import {
  CreateRouteRateDto,
  UpdateRouteRateDto,
  GetRouteRatesQueryDto,
} from './dto';

@ApiTags('Rates')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('rates')
export class RatesController {
  constructor(private readonly service: RatesService) {}

  @Post()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create route rate' })
  async create(@Request() req, @Body() dto: CreateRouteRateDto) {
    return this.service.createRouteRate(req.user.id, req.user.tenantId, dto);
  }

  @Get()
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'List route rates with optional filters' })
  async findAll(@Request() req, @Query() query: GetRouteRatesQueryDto) {
    return this.service.getRouteRates(req.user.tenantId, query);
  }

  @Get('lookups')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get lookup data for rates UI' })
  async lookups(@Request() req) {
    return this.service.getLookups(req.user.tenantId);
  }

  @Get(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get route rate by ID' })
  async findOne(@Request() req, @Param('id') id: string) {
    return this.service.getRouteRateById(req.user.tenantId, id);
  }

  @Patch(':id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Update route rate' })
  async update(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: UpdateRouteRateDto,
  ) {
    return this.service.updateRouteRate(req.user.tenantId, id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.CFO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete route rate' })
  async remove(@Request() req, @Param('id') id: string) {
    return this.service.deleteRouteRate(req.user.tenantId, id);
  }

  @Post('import')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } })) // 2MB
  @ApiOperation({
    summary:
      'Import route rates from CSV (download template first; supports preview mode and commit mode)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        commit: {
          type: 'string',
          enum: ['true', 'false'],
          description:
            'If \"true\", changes are saved. If \"false\" or omitted, runs in preview mode (no changes).',
        },
      },
      required: ['file'],
    },
  })
  async importRatesCsv(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('commit') commit?: string,
    @Query('mode') mode?: string,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException('No file uploaded');
    }
    const doCommit = commit === 'true';
    return this.service.importRatesFromCsv({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      csvBuffer: file.buffer,
      commit: doCommit,
      mode: (mode as 'create' | 'update' | 'upsert') ?? 'upsert',
    });
  }
}
