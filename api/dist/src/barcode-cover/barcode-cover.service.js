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
exports.BarcodeCoverService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const fs = require("fs");
const path = require("path");
const bwipjs = require("bwip-js");
const pdfkit_1 = require("pdfkit");
let BarcodeCoverService = class BarcodeCoverService {
    constructor(config) {
        this.config = config;
    }
    async generateAndSave(trip) {
        const buffer = await this.generatePdf(trip);
        const uploadDir = this.config.get('UPLOAD_PATH', 'uploads');
        const dir = path.join(process.cwd(), uploadDir, 'barcode-cover', trip.id);
        fs.mkdirSync(dir, { recursive: true });
        const filename = `${trip.internalRef}-${Date.now()}.pdf`;
        const filePath = path.join(dir, filename);
        fs.writeFileSync(filePath, buffer);
        const fileKey = `barcode-cover/${trip.id}/${filename}`;
        return { fileKey };
    }
    async generatePdf(trip) {
        const barcodePng = await bwipjs.toBuffer({
            bcid: 'code128',
            text: trip.internalRef,
            scale: 2,
            height: 8,
            includetext: false,
        });
        return new Promise((resolve, reject) => {
            const chunks = [];
            const doc = new pdfkit_1.default({ size: 'A4', margin: 50 });
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
            if (trip.externalRef)
                doc.text(`External Ref: ${trip.externalRef}`);
            doc.end();
        });
    }
};
exports.BarcodeCoverService = BarcodeCoverService;
exports.BarcodeCoverService = BarcodeCoverService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], BarcodeCoverService);
//# sourceMappingURL=barcode-cover.service.js.map