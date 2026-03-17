"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const schedule_1 = require("@nestjs/schedule");
const app_controller_1 = require("./app.controller");
const prisma_module_1 = require("./common/prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const fleet_acquisition_module_1 = require("./fleet-acquisition/fleet-acquisition.module");
const dispatch_module_1 = require("./dispatch/dispatch.module");
const finance_module_1 = require("./finance/finance.module");
const incidents_module_1 = require("./incidents/incidents.module");
const rates_module_1 = require("./rates/rates.module");
const notifications_module_1 = require("./notifications/notifications.module");
const operator_module_1 = require("./operator/operator.module");
const driver_module_1 = require("./driver/driver.module");
const audit_module_1 = require("./audit/audit.module");
const upload_module_1 = require("./upload/upload.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        controllers: [app_controller_1.AppController],
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            fleet_acquisition_module_1.FleetAcquisitionModule,
            dispatch_module_1.DispatchModule,
            finance_module_1.FinanceModule,
            incidents_module_1.IncidentsModule,
            rates_module_1.RatesModule,
            notifications_module_1.NotificationsModule,
            operator_module_1.OperatorModule,
            driver_module_1.DriverModule,
            audit_module_1.AuditModule,
            upload_module_1.UploadModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map