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
exports.FcmService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");
let FcmService = class FcmService {
    constructor(config) {
        this.config = config;
        this.initialized = false;
    }
    onModuleInit() {
        const credPath = this.config.get('GOOGLE_APPLICATION_CREDENTIALS') ||
            this.config.get('FIREBASE_SERVICE_ACCOUNT_JSON');
        if (!credPath)
            return;
        try {
            const resolved = path.isAbsolute(credPath) ? credPath : path.resolve(process.cwd(), credPath);
            if (fs.existsSync(resolved)) {
                const cred = JSON.parse(fs.readFileSync(resolved, 'utf8'));
                if (!admin.apps.length) {
                    admin.initializeApp({ credential: admin.credential.cert(cred) });
                }
                this.initialized = true;
            }
        }
        catch {
        }
    }
    async sendToTokens(tokens, title, body, data) {
        const invalidTokens = [];
        if (!this.initialized || !tokens.length)
            return invalidTokens;
        const message = {
            tokens,
            notification: { title, body },
            data: data ? Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])) : undefined,
            android: { priority: 'high' },
        };
        try {
            const result = await admin.messaging().sendEachForMulticast(message);
            result.responses.forEach((resp, i) => {
                if (!resp.success && resp.error?.code === 'messaging/invalid-registration-token') {
                    invalidTokens.push(tokens[i]);
                }
            });
        }
        catch {
        }
        return invalidTokens;
    }
};
exports.FcmService = FcmService;
exports.FcmService = FcmService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FcmService);
//# sourceMappingURL=fcm.service.js.map