import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import PDFDocument from 'pdfkit';
import { Decimal } from '@prisma/client/runtime/library';

export interface PayoutBatchForPayslip {
  id: string;
  periodStart: Date;
  periodEnd: Date;
  totalTripPayout: Decimal;
  totalAdminFee: Decimal;
  totalReimbursables: Decimal;
  totalCashbondDeduction: Decimal;
  netPayable: Decimal;
  operator: { name: string };
  clientAccount: { name: string; code: string };
  trips: Array<{
    trip: {
      internalRef: string;
      runsheetDate: Date;
      originArea: string;
      destinationArea: string;
    };
    snapshotTripPayout: Decimal;
    snapshotReimbursables: Decimal;
  }>;
}

@Injectable()
export class PayslipService {
  constructor(private config: ConfigService) {}

  async generateAndSave(batch: PayoutBatchForPayslip): Promise<{ fileKey: string }> {
    const buffer = await this.generatePdf(batch);
    const uploadDir = this.config.get<string>('UPLOAD_PATH', 'uploads');
    const dir = path.join(process.cwd(), uploadDir, 'payslips');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${batch.id}.pdf`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    const fileKey = `payslips/${filename}`;
    return { fileKey };
  }

  private async generatePdf(batch: PayoutBatchForPayslip): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
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
        doc.text(
          `${row.trip.internalRef} | ${date} | ${row.trip.originArea} → ${row.trip.destinationArea} | Payout: PHP ${Number(row.snapshotTripPayout).toFixed(2)} | Reimb: PHP ${Number(row.snapshotReimbursables).toFixed(2)}`,
        );
      }

      doc.moveDown(0.5);
      doc.fontSize(9).text(`Generated on ${new Date().toISOString().slice(0, 19)}Z`, {
        align: 'center',
      });
      doc.end();
    });
  }
}
