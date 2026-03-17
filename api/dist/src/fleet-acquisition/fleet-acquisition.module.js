"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FleetAcquisitionModule = void 0;
const common_1 = require("@nestjs/common");
const audit_module_1 = require("../audit/audit.module");
const fleet_acquisition_controller_1 = require("./fleet-acquisition.controller");
const fleet_acquisition_service_1 = require("./fleet-acquisition.service");
const fleet_inventory_controller_1 = require("./fleet-inventory.controller");
const fleet_inventory_service_1 = require("./fleet-inventory.service");
let FleetAcquisitionModule = class FleetAcquisitionModule {
};
exports.FleetAcquisitionModule = FleetAcquisitionModule;
exports.FleetAcquisitionModule = FleetAcquisitionModule = __decorate([
    (0, common_1.Module)({
        imports: [audit_module_1.AuditModule],
        controllers: [fleet_acquisition_controller_1.FleetAcquisitionController, fleet_inventory_controller_1.FleetInventoryController],
        providers: [fleet_acquisition_service_1.FleetAcquisitionService, fleet_inventory_service_1.FleetInventoryService],
        exports: [fleet_acquisition_service_1.FleetAcquisitionService, fleet_inventory_service_1.FleetInventoryService],
    })
], FleetAcquisitionModule);
//# sourceMappingURL=fleet-acquisition.module.js.map