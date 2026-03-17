import { Injectable } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../common/prisma/prisma.service';
import { NotificationsService } from './notifications.service';
import { AssignmentStatus, HighLevelTripStatus, NotificationType, UserRole } from '@prisma/client';

@Injectable()
export class NotificationsScheduler {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Runs every hour at minute 0
  @Cron('0 0 * * * *')
  async hourly() {
    await this.processPendingAcceptanceReminders();
    await this.processCallTimeReminders();
  }

  private async processPendingAcceptanceReminders() {
    const trips = await this.prisma.trip.findMany({
      where: {
        assignmentStatus: AssignmentStatus.ASSIGNED_PENDING_ACCEPTANCE,
        assignedDriverId: { not: null },
        highLevelTripStatus: { notIn: [HighLevelTripStatus.CANCELLED] },
      },
      select: {
        id: true,
        tenantId: true,
        internalRef: true,
        assignedDriverId: true,
      },
      take: 500,
    });

    for (const trip of trips) {
      const driverUser = await this.prisma.user.findFirst({
        where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId!, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!driverUser) continue;

      const payload = { tripId: trip.id };
      const sent = await this.notifications.wasSentInLastHour({
        userId: driverUser.id,
        type: NotificationType.TRIP_ASSIGNMENT_REMINDER,
        payloadJson: payload,
      });
      if (sent) continue;

      await this.notifications.create({
        tenantId: trip.tenantId,
        userId: driverUser.id,
        type: NotificationType.TRIP_ASSIGNMENT_REMINDER,
        title: 'Trip assignment pending acceptance',
        body: `Please accept your assigned trip (${trip.internalRef}).`,
        payloadJson: payload,
      });
    }
  }

  private async processCallTimeReminders() {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 3 * 60 * 60 * 1000);

    const trips = await this.prisma.trip.findMany({
      where: {
        assignmentStatus: AssignmentStatus.ACCEPTED,
        highLevelTripStatus: { notIn: [HighLevelTripStatus.COMPLETED, HighLevelTripStatus.CANCELLED] },
        callTime: { lte: now },
        // reminder window begins at call_time - 3h, but we approximate by picking accepted trips with callTime within reasonable range
      },
      select: {
        id: true,
        tenantId: true,
        internalRef: true,
        assignedDriverId: true,
        callTime: true,
        lastDriverEventAt: true,
      },
      take: 500,
    });

    for (const trip of trips) {
      if (!trip.assignedDriverId) continue;
      const reminderWindowStart = new Date(trip.callTime.getTime() - 3 * 60 * 60 * 1000);
      if (now < reminderWindowStart) continue;

      const driverUser = await this.prisma.user.findFirst({
        where: { tenantId: trip.tenantId, driverId: trip.assignedDriverId, status: 'ACTIVE' },
        select: { id: true },
      });
      if (!driverUser) continue;

      const noUpdatesSinceWindow =
        !trip.lastDriverEventAt || trip.lastDriverEventAt < reminderWindowStart;

      // Driver reminder: hourly during window until an event is received
      if (noUpdatesSinceWindow) {
        const payload = { tripId: trip.id };
        const sent = await this.notifications.wasSentInLastHour({
          userId: driverUser.id,
          type: NotificationType.CALLTIME_REMINDER_DRIVER,
          payloadJson: payload,
        });
        if (!sent) {
          await this.notifications.create({
            tenantId: trip.tenantId,
            userId: driverUser.id,
            type: NotificationType.CALLTIME_REMINDER_DRIVER,
            title: 'Reminder: trip update needed',
            body: `Please submit an update for trip (${trip.internalRef}).`,
            payloadJson: payload,
          });
        }
      }

      // Coordinator escalation: after call time, if still no update since window began
      if (now >= trip.callTime && noUpdatesSinceWindow) {
        const coordinators = await this.prisma.user.findMany({
          where: { tenantId: trip.tenantId, role: UserRole.OPERATIONS_ACCOUNT_COORDINATOR, status: 'ACTIVE' },
          select: { id: true },
          take: 50,
        });

        for (const coord of coordinators) {
          const payload = { tripId: trip.id };
          const sent = await this.notifications.wasSentInLastHour({
            userId: coord.id,
            type: NotificationType.NO_UPDATE_ALERT_COORDINATOR,
            payloadJson: payload,
          });
          if (sent) continue;

          await this.notifications.create({
            tenantId: trip.tenantId,
            userId: coord.id,
            type: NotificationType.NO_UPDATE_ALERT_COORDINATOR,
            title: 'No driver updates after call time',
            body: `Trip (${trip.internalRef}) has no updates since reminder window began.`,
            payloadJson: payload,
          });
        }
      }
    }
  }
}

