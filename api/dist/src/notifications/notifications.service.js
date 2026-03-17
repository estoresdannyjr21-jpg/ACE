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
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const client_1 = require("@prisma/client");
const fcm_service_1 = require("./fcm.service");
let NotificationsService = class NotificationsService {
    constructor(prisma, fcm) {
        this.prisma = prisma;
        this.fcm = fcm;
    }
    async create(params) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: params.userId,
                type: params.type,
                title: params.title,
                body: params.body,
                payloadJson: params.payloadJson ?? undefined,
                status: client_1.NotificationStatus.SENT,
            },
        });
        this.sendFcmPush(params.userId, params.title, params.body, params.payloadJson).catch(() => { });
        return notification;
    }
    async sendFcmPush(userId, title, body, payloadJson) {
        const tokens = await this.prisma.userFcmToken.findMany({
            where: { userId },
            select: { token: true },
        });
        if (!tokens.length)
            return;
        const tokenStrings = tokens.map((t) => t.token);
        const data = {};
        if (payloadJson && typeof payloadJson === 'object' && payloadJson !== null) {
            for (const [k, v] of Object.entries(payloadJson)) {
                data[k] = typeof v === 'string' ? v : JSON.stringify(v);
            }
        }
        const invalidTokens = await this.fcm.sendToTokens(tokenStrings, title, body, Object.keys(data).length ? data : undefined);
        if (invalidTokens.length) {
            await this.prisma.userFcmToken.deleteMany({
                where: { userId, token: { in: invalidTokens } },
            });
        }
    }
    async registerDevice(userId, token, deviceId) {
        return this.prisma.userFcmToken.upsert({
            where: {
                userId_token: { userId, token },
            },
            create: { userId, token, deviceId: deviceId ?? null },
            update: { deviceId: deviceId ?? null },
        });
    }
    async unregisterDevice(userId, token) {
        await this.prisma.userFcmToken.deleteMany({
            where: { userId, token },
        });
        return { ok: true };
    }
    async list(userId) {
        return this.prisma.notification.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 200,
        });
    }
    async markRead(userId, id) {
        return this.prisma.notification.updateMany({
            where: { id, userId },
            data: { status: client_1.NotificationStatus.READ, readAt: new Date() },
        });
    }
    async wasSentInLastHour(params) {
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const where = {
            userId: params.userId,
            type: params.type,
            createdAt: { gte: oneHourAgo },
            ...(params.payloadJson ? { payloadJson: { equals: params.payloadJson } } : {}),
        };
        const existing = await this.prisma.notification.findFirst({ where });
        return !!existing;
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        fcm_service_1.FcmService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map