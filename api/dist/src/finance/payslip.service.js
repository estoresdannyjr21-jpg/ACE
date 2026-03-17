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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PayslipService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
const pdfkit_1 = require("pdfkit");
let PayslipService = class PayslipService {
    constructor(config) {
        this.config = config;
    }
    async generateAndSave(batch) {
        const buffer = await this.generatePdf(batch);
        const uploadDir = this.config.get('UPLOAD_PATH', 'uploads');
        const dir = path.join(process.cwd(), uploadDir, 'payslips');
        fs.mkdirSync(dir, { recursive: true });
        const filename = `${batch.id}.pdf`;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, buffer);
        const fileKey = `payslips/${filename}`;
        return { fileKey };
    }
    async generatePdf(batch) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            doc.fontSize(16).text('Payout Payslip', { align: 'center' });
            doc.moveDown(0.5);
            doc.fontSize(10);
            const periodStart = new Date(batch.periodStart).toISOString().slice(0, 10);
            const periodEnd = new Date(batch.periodEnd).toISOString().slice(0, 10);
            doc.text(`Operator: ${batch.operator.name}`);
            doc.text(`Client: ${batch.clientAccount.name} (${batch.clientAccount.code})`);
            doc.text(`Period: ${periodStart} to ${periodEnd}`);
            doc.moveDown(1);
            doc.fontSize(12).text('Summary', { underline: true });
            doc.fontSize(10);
            doc.text(`Total Trip Payout:     PHP ${Number(batch.totalTripPayout).toFixed(2)}`);
            doc.text(`Total Admin Fee:       PHP ${Number(batch.totalAdminFee).toFixed(2)}`);
            doc.text(`Total Reimbursables:   PHP ${Number(batch.totalReimbursables).toFixed(2)}`);
            doc.text(`Cashbond Deduction:    PHP ${Number(batch.totalCashbondDeduction).toFixed(2)}`);
            doc.text(`Net Payable:           PHP ${Number(batch.netPayable).toFixed(2)}`, {
                continued: false,
            });
            doc.moveDown(1);
            doc.fontSize(12).text('Trip Details', { underline: true });
            doc.moveDown(0.3);
            for (const row of batch.trips) {
                const date = new Date(row.trip.runsheetDate).toISOString().slice(0, 10);
                doc.text(`${row.trip.internalRef} | ${date} | ${row.trip.originArea} → ${row.trip.destinationArea} | Payout: PHP ${Number(row.snapshotTripPayout).toFixed(2)} | Reimb: PHP ${Number(row.snapshotReimbursables).toFixed(2)}`);
            }
            doc.moveDown(0.5);
            doc.fontSize(9).text(`Generated on ${new Date().toISOString().slice(0, 19)}Z`, {
                align: 'center',
            });
            doc.end();
        });
    }
};
exports.PayslipService = PayslipService;
exports.PayslipService = PayslipService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], PayslipService);
//# sourceMappingURL=payslip.service.js.map