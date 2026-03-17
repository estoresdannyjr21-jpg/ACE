import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationType, NotificationStatus, Prisma } from '@prisma/client';
import { FcmService } from './fcm.service';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private fcm: FcmService,
  ) {}

  async create(params: {
    tenantId: string;
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    payloadJson?: Prisma.InputJsonValue;
  }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        type: params.type,
        title: params.title,
        body: params.body,
        payloadJson: params.payloadJson ?? undefined,
        status: NotificationStatus.SENT,
      },
    });

    this.sendFcmPush(params.userId, params.title, params.body, params.payloadJson).catch(() => {});

    return notification;
  }

  private async sendFcmPush(
    userId: string,
    title: string,
    body: string,
    payloadJson?: Prisma.InputJsonValue,
  ) {
    const tokens = await this.prisma.userFcmToken.findMany({
      where: { userId },
      select: { token: true },
    });
    if (!tokens.length) return;
    const tokenStrings = tokens.map((t) => t.token);
    const data: Record<string, string> = {};
    if (payloadJson && typeof payloadJson === 'object' && payloadJson !== null) {
      for (const [k, v] of Object.entries(payloadJson)) {
        data[k] = typeof v === 'string' ? v : JSON.stringify(v);
      }
    }
    const invalidTokens = await this.fcm.sendToTokens(
      tokenStrings,
      title,
      body,
      Object.keys(data).length ? data : undefined,
    );
    if (invalidTokens.length) {
      await this.prisma.userFcmToken.deleteMany({
        where: { userId, token: { in: invalidTokens } },
      });
    }
  }

  async registerDevice(userId: string, token: string, deviceId?: string) {
    return this.prisma.userFcmToken.upsert({
      where: {
        userId_token: { userId, token },
      },
      create: { userId, token, deviceId: deviceId ?? null },
      update: { deviceId: deviceId ?? null },
    });
  }

  async unregisterDevice(userId: string, token: string) {
    await this.prisma.userFcmToken.deleteMany({
      where: { userId, token },
    });
    return { ok: true };
  }

  async list(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { status: NotificationStatus.READ, readAt: new Date() },
    });
  }

  async wasSentInLastHour(params: { userId: string; type: NotificationType; payloadJson?: Prisma.InputJsonValue }) {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const where: Prisma.NotificationWhereInput = {
      userId: params.userId,
      type: params.type,
      createdAt: { gte: oneHourAgo },
      ...(params.payloadJson ? { payloadJson: { equals: params.payloadJson as any } } : {}),
    };
    const existing = await this.prisma.notification.findFirst({ where });
    return !!existing;
  }
}

