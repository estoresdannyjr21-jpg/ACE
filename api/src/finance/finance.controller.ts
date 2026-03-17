import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
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
import { FinanceService } from './finance.service';
import {
  CreatePayoutBatchDto,
  GetPayoutBatchesQueryDto,
  GetEligibleTripsQueryDto,
  SetBatchHeldDto,
  SubmitOverrideRequestDto,
  RejectOverrideRequestDto,
  UpdateReimbursablesDto,
} from './dto';
import { FinanceDashboardQueryDto } from './dto/finance-dashboard.dto';
import { ArLedgerQueryDto, ApLedgerQueryDto } from './dto/ar-ap-reports.dto';
import { GetArBatchesQueryDto, AttachInvoiceDto } from './dto/ar-batch.dto';

@ApiTags('Finance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('finance')
export class FinanceController {
  constructor(private service: FinanceService) {}

  @Get('lookups')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get clients and operators for dashboard filters' })
  async getFinanceLookups(@Request() req) {
    return this.service.getFinanceLookups(req.user.tenantId);
  }

  @Get('dashboard')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Finance dashboard: counts and lists (POD/doc, AR/AP, reimbursables, overrides)' })
  async getFinanceDashboard(@Request() req, @Query() query: FinanceDashboardQueryDto) {
    return this.service.getFinanceDashboard(req.user.tenantId, query);
  }

  @Get('reports/ar-ledger')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'AR ledger and aging: receivables (READY_TO_BILL / BILLED) by trip with aging buckets' })
  async getArLedger(@Request() req, @Query() query: ArLedgerQueryDto) {
    return this.service.getArLedger(req.user.tenantId, query);
  }

  @Get('reports/ap-ledger')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'AP ledger and aging: payables to operators (not PAID) by trip with aging buckets' })
  async getApLedger(@Request() req, @Query() query: ApLedgerQueryDto) {
    return this.service.getApLedger(req.user.tenantId, query);
  }

  @Get('trips/scan/:internalRef')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get trip by internal reference (barcode scan)' })
  async getTripByInternalRef(@Request() req, @Param('internalRef') internalRef: string) {
    return this.service.getTripByInternalRef(req.user.tenantId, internalRef);
  }

  @Post('trips/:id/mark-doc-received')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark Finance Doc Received' })
  async markFinanceDocReceived(@Request() req, @Param('id') tripId: string) {
    return this.service.markFinanceDocReceived(req.user.id, req.user.tenantId, tripId);
  }

  @Post('trips/:id/compute')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Compute trip finance from route rate' })
  async computeTripFinance(@Request() req, @Param('id') tripId: string) {
    return this.service.computeTripFinance(req.user.tenantId, tripId, req.user.id);
  }

  @Patch('trips/:id/reimbursables')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Encode reimbursables (toll/gas/parking) and set status' })
  async updateReimbursables(
    @Request() req,
    @Param('id') tripId: string,
    @Body() dto: UpdateReimbursablesDto,
  ) {
    return this.service.updateReimbursables(req.user.tenantId, tripId, dto);
  }

  @Get('payout-batches/eligible')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get trips eligible for a batch (target release date + operator + client)' })
  async getEligibleTripsForRelease(@Request() req, @Query() query: GetEligibleTripsQueryDto) {
    return this.service.getEligibleTripsForRelease(req.user.tenantId, {
      targetReleaseDate: query.targetReleaseDate,
      operatorId: query.operatorId,
      clientAccountId: query.clientAccountId,
    });
  }

  @Post('payout-batches')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create payout batch for target release date (include only eligible trips; exclusions require reason)' })
  async createPayoutBatch(@Request() req, @Body() dto: CreatePayoutBatchDto) {
    return this.service.createPayoutBatch(req.user.tenantId, dto);
  }

  @Get('payout-batches')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'List payout batches' })
  async getPayoutBatches(@Request() req, @Query() query: GetPayoutBatchesQueryDto) {
    return this.service.getPayoutBatches(req.user.tenantId, query);
  }

  @Get('payout-batches/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get payout batch by ID' })
  async getPayoutBatch(@Request() req, @Param('id') id: string) {
    return this.service.getPayoutBatch(req.user.tenantId, id);
  }

  @Post('payout-batches/:id/approve-fin-mgr')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE_MANAGER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve payout batch (Finance Manager)' })
  async approveByFinMgr(@Request() req, @Param('id') id: string) {
    return this.service.approvePayoutBatchByFinMgr(req.user.tenantId, id, req.user.id);
  }

  @Post('payout-batches/:id/approve-cfo')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CFO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve payout batch (CFO)' })
  async approveByCfo(@Request() req, @Param('id') id: string) {
    return this.service.approvePayoutBatchByCfo(req.user.tenantId, id, req.user.id);
  }

  @Patch('payout-batches/:id/hold')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER, UserRole.FINANCE_MANAGER, UserRole.CFO)
  @ApiOperation({ summary: 'Set batch hold (true = hold payout, false = release)' })
  async setBatchHeld(@Request() req, @Param('id') id: string, @Body() dto: SetBatchHeldDto) {
    return this.service.setBatchHeld(req.user.tenantId, id, dto.held);
  }

  @Post('trips/:id/override-request')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.MANAGER)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Submit payout override request (e.g. expired 30-day deadline)' })
  async submitOverrideRequest(
    @Request() req,
    @Param('id') tripId: string,
    @Body() dto: SubmitOverrideRequestDto,
  ) {
    return this.service.submitOverrideRequest(
      req.user.id,
      req.user.tenantId,
      tripId,
      dto.reason,
    );
  }

  @Post('override-requests/:id/approve')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CFO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve override request (CFO)' })
  async approveOverrideRequest(@Request() req, @Param('id') id: string) {
    return this.service.approveOverrideRequest(req.user.tenantId, id, req.user.id);
  }

  @Post('override-requests/:id/reject')
  @Roles(UserRole.SUPER_ADMIN, UserRole.ADMIN, UserRole.CFO)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject override request (CFO)' })
  async rejectOverrideRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: RejectOverrideRequestDto,
  ) {
    return this.service.rejectOverrideRequest(
      req.user.tenantId,
      id,
      dto.rejectionReason,
      req.user.id,
    );
  }

  @Get('ar/batches')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'List AR batches with optional filters' })
  async getArBatches(@Request() req, @Query() query: GetArBatchesQueryDto) {
    return this.service.getArBatches(req.user.tenantId, query);
  }

  @Get('ar/batches/:id')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Get AR batch by ID with trips and unmatched lines' })
  async getArBatchById(@Request() req, @Param('id') id: string) {
    return this.service.getArBatchById(req.user.tenantId, id);
  }

  @Patch('ar/batches/:id/attach-invoice')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @ApiOperation({ summary: 'Attach invoice to AR batch; set trips in batch to BILLED' })
  async attachInvoice(
    @Request() req,
    @Param('id') id: string,
    @Body() dto: AttachInvoiceDto,
  ) {
    return this.service.attachInvoiceToArBatch(req.user.tenantId, req.user.id, id, dto);
  }

  @Patch('ar/batches/:id/deposited')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark AR batch as deposited; set trips in batch to PAID' })
  async markArBatchDeposited(@Request() req, @Param('id') id: string) {
    return this.service.markArBatchDeposited(req.user.tenantId, req.user.id, id);
  }

  @Post('ar/reverse-billing/import')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 5 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Import client reverse billing CSV (preview or commit)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        client_code: { type: 'string', example: 'SPX' },
        service_segment: { type: 'string', enum: ['FM_ONCALL', 'FM_WETLEASE', 'MFM_ONCALL'] },
        cutoff_start_date: { type: 'string', example: '2026-02-01' },
        cutoff_end_date: { type: 'string', example: '2026-02-15' },
      },
      required: ['file', 'client_code', 'service_segment', 'cutoff_start_date', 'cutoff_end_date'],
    },
  })
  async importReverseBilling(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('commit') commit?: string,
    @Query('client_code') clientCode?: string,
    @Query('service_segment') serviceSegment?: string,
    @Query('cutoff_start_date') cutoffStartDate?: string,
    @Query('cutoff_end_date') cutoffEndDate?: string,
  ) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    if (!clientCode || !serviceSegment || !cutoffStartDate || !cutoffEndDate) {
      throw new BadRequestException('client_code, service_segment, cutoff_start_date, cutoff_end_date are required');
    }
    return this.service.importReverseBillingCsv({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      csvBuffer: file.buffer,
      commit: commit === 'true',
      clientCode,
      serviceSegment: serviceSegment as 'FM_ONCALL' | 'FM_WETLEASE' | 'MFM_ONCALL',
      cutoffStartDate,
      cutoffEndDate,
    });
  }

  @Post('ar/payment-list/import')
  @Roles(
    UserRole.SUPER_ADMIN,
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.FINANCE_PERSONNEL,
    UserRole.FINANCE_MANAGER,
    UserRole.CFO,
  )
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 2 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Import payment list CSV (preview or commit)' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        client_code: { type: 'string' },
        payment_list_received_date: { type: 'string', example: '2026-03-10' },
      },
      required: ['file', 'client_code', 'payment_list_received_date'],
    },
  })
  async importPaymentList(
    @Request() req,
    @UploadedFile() file: Express.Multer.File,
    @Query('commit') commit?: string,
    @Query('client_code') clientCode?: string,
    @Query('payment_list_received_date') paymentListReceivedDate?: string,
  ) {
    if (!file?.buffer) throw new BadRequestException('No file uploaded');
    if (!clientCode || !paymentListReceivedDate) {
      throw new BadRequestException('client_code and payment_list_received_date are required');
    }
    return this.service.importPaymentListCsv({
      userId: req.user.id,
      tenantId: req.user.tenantId,
      csvBuffer: file.buffer,
      commit: commit === 'true',
      clientCode,
      paymentListReceivedDate,
    });
  }
}
