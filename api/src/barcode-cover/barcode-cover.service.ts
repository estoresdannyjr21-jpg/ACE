import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import * as bwipjs from 'bwip-js';
import PDFDocument from 'pdfkit';

export interface TripForBarcode {
  id: string;
  internalRef: string;
  runsheetDate: Date;
  requestDeliveryDate: Date | null;
  originArea: string;
  destinationArea: string;
  externalRef: string | null;
  clientAccount?: { name: string; code: string } | null;
  serviceCategory?: { name: string; code: string } | null;
  assignedDriver?: { firstName: string; lastName: string } | null;
  assignedVehicle?: { plateNumber: string } | null;
}

@Injectable()
export class BarcodeCoverService {
  constructor(private config: ConfigService) {}

  async generateAndSave(trip: TripForBarcode): Promise<{ fileKey: string }> {
    const buffer = await this.generatePdf(trip);
    const uploadDir = this.config.get<string>('UPLOAD_PATH', 'uploads');
    const dir = path.join(process.cwd(), uploadDir, 'barcode-cover', trip.id);
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${trip.internalRef}-${Date.now()}.pdf`;
    const filePath = path.join(dir, filename);
    fs.writeFileSync(filePath, buffer);
    const fileKey = `barcode-cover/${trip.id}/${filename}`;
    return { fileKey };
  }

  private async generatePdf(trip: TripForBarcode): Promise<Buffer> {
    const barcodePng = await bwipjs.toBuffer({
      bcid: 'code128',
      text: trip.internalRef,
      scale: 2,
      height: 8,
      includetext: false,
    });

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ size: 'A4', margin: 50 });
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(10);
      doc.text('Barcode Cover Sheet', { align: 'center' });
      doc.moveDown(0.5);

      const barcodeHeight = 60;
      doc.image(barcodePng, { width: 280, height: barcodeHeight });
      doc.moveDown(0.3);
      doc.fontSize(14).text(trip.internalRef, { align: 'center' });
      doc.moveDown(1);

      doc.fontSize(10);
      const clientName = trip.clientAccount?.name ?? 'N/A';
      const categoryName = trip.serviceCategory?.name ?? 'N/A';
      const runsheetStr = trip.runsheetDate ? new Date(trip.runsheetDate).toISOString().slice(0, 10) : 'N/A';
      const reqDateStr = trip.requestDeliveryDate
        ? new Date(trip.requestDeliveryDate).toISOString().slice(0, 10)
        : 'N/A';
      const driverName = trip.assignedDriver
        ? `${trip.assignedDriver.firstName} ${trip.assignedDriver.lastName}`
        : 'N/A';
      const plate = trip.assignedVehicle?.plateNumber ?? 'N/A';

      doc.text(`Client: ${clientName}`);
      doc.text(`Category: ${categoryName}`);
      doc.text(`Runsheet Date: ${runsheetStr}`);
      doc.text(`Request Delivery Date: ${reqDateStr}`);
      doc.text(`Driver: ${driverName}`);
      doc.text(`Plate: ${plate}`);
      doc.text(`Origin: ${trip.originArea}`);
      doc.text(`Destination: ${trip.destinationArea}`);
      if (trip.externalRef) doc.text(`External Ref: ${trip.externalRef}`);

      doc.end();
    });
  }
}
