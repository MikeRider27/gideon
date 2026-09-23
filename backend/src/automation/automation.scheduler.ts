import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Queue } from 'bullmq';

@Injectable()
export class AutomationScheduler {
  constructor(@InjectQueue('automation') private automationQueue: Queue) {}

  @Cron(CronExpression.EVERY_HOUR)
  async scheduleLowStockCheck() {
    await this.automationQueue.add('low-stock-check', {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_7AM)
  async scheduleInvoiceOverdueCheck() {
    await this.automationQueue.add('invoice-overdue-check', {});
  }

  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async scheduleDailyReport() {
    await this.automationQueue.add('daily-report', {});
  }
}
