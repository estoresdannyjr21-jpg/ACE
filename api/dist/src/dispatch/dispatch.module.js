"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DispatchModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const barcode_cover_module_1 = require("../barcode-cover/barcode-cover.module");
const incidents_module_1 = require("../incidents/incidents.module");
const notifications_module_1 = require("../notifications/notifications.module");
const rates_module_1 = require("../rates/rates.module");
const dispatch_controller_1 = require("./dispatch.controller");
const dispatch_service_1 = require("./dispatch.service");
let DispatchModule = class DispatchModule {
};
exports.DispatchModule = DispatchModule;
exports.DispatchModule = DispatchModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule, notifications_module_1.NotificationsModule, incidents_module_1.IncidentsModule, barcode_cover_module_1.BarcodeCoverModule, rates_module_1.RatesModule],
        controllers: [dispatch_controller_1.DispatchController],
        providers: [dispatch_service_1.DispatchService],
        exports: [dispatch_service_1.DispatchService],
    })
], DispatchModule);
//# sourceMappingURL=dispatch.module.js.map