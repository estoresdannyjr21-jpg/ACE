"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FinanceController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const rbac_guard_1 = require("../common/guards/rbac.guard");
const client_1 = require("@prisma/client");
const finance_service_1 = require("./finance.service");
const dto_1 = require("./dto");
const finance_dashboard_dto_1 = require("./dto/finance-dashboard.dto");
const ar_ap_reports_dto_1 = require("./dto/ar-ap-reports.dto");
const ar_batch_dto_1 = require("./dto/ar-batch.dto");
let FinanceController = class FinanceController {
    constructor(service) {
        this.service = service;
    }
    async getFinanceLookups(req) {
        return this.service.getFinanceLookups(req.user.tenantId);
    }
    async getFinanceDashboard(req, query) {
        return this.service.getFinanceDashboard(req.user.tenantId, query);
    }
    async getArLedger(req, query) {
        return this.service.getArLedger(req.user.tenantId, query);
    }
    async getApLedger(req, query) {
        return this.service.getApLedger(req.user.tenantId, query);
    }
    async getTripByInternalRef(req, internalRef) {
        return this.service.getTripByInternalRef(req.user.tenantId, internalRef);
    }
    async markFinanceDocReceived(req, tripId) {
        return this.service.markFinanceDocReceived(req.user.id, req.user.tenantId, tripId);
    }
    async computeTripFinance(req, tripId) {
        return this.service.computeTripFinance(req.user.tenantId, tripId, req.user.id);
    }
    async updateReimbursables(req, tripId, dto) {
        return this.service.updateReimbursables(req.user.tenantId, tripId, dto);
    }
    async getEligibleTripsForRelease(req, query) {
        return this.service.getEligibleTripsForRelease(req.user.tenantId, {
            targetReleaseDate: query.targetReleaseDate,
            operatorId: query.operatorId,
            clientAccountId: query.clientAccountId,
        });
    }
    async createPayoutBatch(req, dto) {
        return this.service.createPayoutBatch(req.user.tenantId, dto);
    }
    async getPayoutBatches(req, query) {
        return this.service.getPayoutBatches(req.user.tenantId, query);
    }
    async getPayoutBatch(req, id) {
        return this.service.getPayoutBatch(req.user.tenantId, id);
    }
    async approveByFinMgr(req, id) {
        return this.service.approvePayoutBatchByFinMgr(req.user.tenantId, id, req.user.id);
    }
    async approveByCfo(req, id) {
        return this.service.approvePayoutBatchByCfo(req.user.tenantId, id, req.user.id);
    }
    async setBatchHeld(req, id, dto) {
        return this.service.setBatchHeld(req.user.tenantId, id, dto.held);
    }
    async submitOverrideRequest(req, tripId, dto) {
        return this.service.submitOverrideRequest(req.user.id, req.user.tenantId, tripId, dto.reason);
    }
    async approveOverrideRequest(req, id) {
        return this.service.approveOverrideRequest(req.user.tenantId, id, req.user.id);
    }
    async rejectOverrideRequest(req, id, dto) {
        return this.service.rejectOverrideRequest(req.user.tenantId, id, dto.rejectionReason, req.user.id);
    }
    async getArBatches(req, query) {
        return this.service.getArBatches(req.user.tenantId, query);
    }
    async getArBatchById(req, id) {
        return this.service.getArBatchById(req.user.tenantId, id);
    }
    async attachInvoice(req, id, dto) {
        return this.service.attachInvoiceToArBatch(req.user.tenantId, req.user.id, id, dto);
    }
    async markArBatchDeposited(req, id) {
        return this.service.markArBatchDeposited(req.user.tenantId, req.user.id, id);
    }
    async importReverseBilling(req, file, commit, clientCode, serviceSegment, cutoffStartDate, cutoffEndDate) {
        if (!file?.buffer)
            throw new common_1.BadRequestException('No file uploaded');
        if (!clientCode || !serviceSegment || !cutoffStartDate || !cutoffEndDate) {
            throw new common_1.BadRequestException('client_code, service_segment, cutoff_start_date, cutoff_end_date are required');
        }
        return this.service.importReverseBillingCsv({
            userId: req.user.id,
            tenantId: req.user.tenantId,
            csvBuffer: file.buffer,
            commit: commit === 'true',
            clientCode,
            serviceSegment: serviceSegment,
            cutoffStartDate,
            cutoffEndDate,
        });
    }
    async importPaymentList(req, file, commit, clientCode, paymentListReceivedDate) {
        if (!file?.buffer)
            throw new common_1.BadRequestException('No file uploaded');
        if (!clientCode || !paymentListReceivedDate) {
            throw new common_1.BadRequestException('client_code and payment_list_received_date are required');
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
};
exports.FinanceController = FinanceController;
__decorate([
    (0, common_1.Get)('lookups'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get clients and operators for dashboard filters' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFinanceLookups", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Finance dashboard: counts and lists (POD/doc, AR/AP, reimbursables, overrides)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, finance_dashboard_dto_1.FinanceDashboardQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getFinanceDashboard", null);
__decorate([
    (0, common_1.Get)('reports/ar-ledger'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'AR ledger and aging: receivables (READY_TO_BILL / BILLED) by trip with aging buckets' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ar_ap_reports_dto_1.ArLedgerQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getArLedger", null);
__decorate([
    (0, common_1.Get)('reports/ap-ledger'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'AP ledger and aging: payables to operators (not PAID) by trip with aging buckets' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ar_ap_reports_dto_1.ApLedgerQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getApLedger", null);
__decorate([
    (0, common_1.Get)('trips/scan/:internalRef'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get trip by internal reference (barcode scan)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('internalRef')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getTripByInternalRef", null);
__decorate([
    (0, common_1.Post)('trips/:id/mark-doc-received'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark Finance Doc Received' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "markFinanceDocReceived", null);
__decorate([
    (0, common_1.Post)('trips/:id/compute'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Compute trip finance from route rate' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "computeTripFinance", null);
__decorate([
    (0, common_1.Patch)('trips/:id/reimbursables'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Encode reimbursables (toll/gas/parking) and set status' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.UpdateReimbursablesDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "updateReimbursables", null);
__decorate([
    (0, common_1.Get)('payout-batches/eligible'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get trips eligible for a batch (target release date + operator + client)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetEligibleTripsQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getEligibleTripsForRelease", null);
__decorate([
    (0, common_1.Post)('payout-batches'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Create payout batch for target release date (include only eligible trips; exclusions require reason)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreatePayoutBatchDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "createPayoutBatch", null);
__decorate([
    (0, common_1.Get)('payout-batches'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'List payout batches' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.GetPayoutBatchesQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getPayoutBatches", null);
__decorate([
    (0, common_1.Get)('payout-batches/:id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get payout batch by ID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getPayoutBatch", null);
__decorate([
    (0, common_1.Post)('payout-batches/:id/approve-fin-mgr'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve payout batch (Finance Manager)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "approveByFinMgr", null);
__decorate([
    (0, common_1.Post)('payout-batches/:id/approve-cfo'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve payout batch (CFO)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "approveByCfo", null);
__decorate([
    (0, common_1.Patch)('payout-batches/:id/hold'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Set batch hold (true = hold payout, false = release)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SetBatchHeldDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "setBatchHeld", null);
__decorate([
    (0, common_1.Post)('trips/:id/override-request'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: 'Submit payout override request (e.g. expired 30-day deadline)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.SubmitOverrideRequestDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "submitOverrideRequest", null);
__decorate([
    (0, common_1.Post)('override-requests/:id/approve'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Approve override request (CFO)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "approveOverrideRequest", null);
__decorate([
    (0, common_1.Post)('override-requests/:id/reject'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Reject override request (CFO)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dto_1.RejectOverrideRequestDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "rejectOverrideRequest", null);
__decorate([
    (0, common_1.Get)('ar/batches'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'List AR batches with optional filters' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, ar_batch_dto_1.GetArBatchesQueryDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getArBatches", null);
__decorate([
    (0, common_1.Get)('ar/batches/:id'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Get AR batch by ID with trips and unmatched lines' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "getArBatchById", null);
__decorate([
    (0, common_1.Patch)('ar/batches/:id/attach-invoice'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, swagger_1.ApiOperation)({ summary: 'Attach invoice to AR batch; set trips in batch to BILLED' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, ar_batch_dto_1.AttachInvoiceDto]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "attachInvoice", null);
__decorate([
    (0, common_1.Patch)('ar/batches/:id/deposited'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Mark AR batch as deposited; set trips in batch to PAID' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "markArBatchDeposited", null);
__decorate([
    (0, common_1.Post)('ar/reverse-billing/import'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 5 * 1024 * 1024 } })),
    (0, swagger_1.ApiOperation)({ summary: 'Import client reverse billing CSV (preview or commit)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
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
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('commit')),
    __param(3, (0, common_1.Query)('client_code')),
    __param(4, (0, common_1.Query)('service_segment')),
    __param(5, (0, common_1.Query)('cutoff_start_date')),
    __param(6, (0, common_1.Query)('cutoff_end_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "importReverseBilling", null);
__decorate([
    (0, common_1.Post)('ar/payment-list/import'),
    (0, rbac_guard_1.Roles)(client_1.UserRole.SUPER_ADMIN, client_1.UserRole.ADMIN, client_1.UserRole.MANAGER, client_1.UserRole.FINANCE_PERSONNEL, client_1.UserRole.FINANCE_MANAGER, client_1.UserRole.CFO),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file', { limits: { fileSize: 2 * 1024 * 1024 } })),
    (0, swagger_1.ApiOperation)({ summary: 'Import payment list CSV (preview or commit)' }),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                file: { type: 'string', format: 'binary' },
                client_code: { type: 'string' },
                payment_list_received_date: { type: 'string', example: '2026-03-10' },
            },
            required: ['file', 'client_code', 'payment_list_received_date'],
        },
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Query)('commit')),
    __param(3, (0, common_1.Query)('client_code')),
    __param(4, (0, common_1.Query)('payment_list_received_date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String, String, String]),
    __metadata("design:returntype", Promise)
], FinanceController.prototype, "importPaymentList", null);
exports.FinanceController = FinanceController = __decorate([
    (0, swagger_1.ApiTags)('Finance'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, rbac_guard_1.RolesGuard),
    (0, common_1.Controller)('finance'),
    __metadata("design:paramtypes", [finance_service_1.FinanceService])
], FinanceController);
//# sourceMappingURL=finance.controller.js.map