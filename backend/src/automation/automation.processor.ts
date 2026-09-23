import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { AutomationService } from './automation.service';

@Processor('automation')
export class AutomationProcessor extends WorkerHost {
  private readonly logger = new Logger(AutomationProcessor.name);

  constructor(private automationService: AutomationService) {
    super();
  }

  async process(job: Job): Promise<unknown> {
    this.logger.log(`Ejecutando job de automatizacion: ${job.name}`);
    switch (job.name) {
      case 'low-stock-check':
        return this.automationService.runLowStockCheck();
      case 'invoice-overdue-check':
        return this.automationService.runInvoiceOverdueCheck();
      case 'daily-report':
        return this.automationService.runDailyReport();
      default:
        this.logger.warn(`Job desconocido: ${job.name}`);
        return null;
    }
  }
}
