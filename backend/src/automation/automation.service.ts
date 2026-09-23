import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from '../inventory/products.service';
import { InvoicesService } from '../billing/invoices.service';
import { AnalyticsService } from '../ai/analytics.service';
import { AutomationType } from '@prisma/client';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(
    private prisma: PrismaService,
    private products: ProductsService,
    private invoices: InvoicesService,
    private analytics: AnalyticsService,
  ) {}

  private async log(type: AutomationType, status: 'SUCCESS' | 'FAILURE' | 'SKIPPED', summary: string, details?: unknown) {
    return this.prisma.automationLog.create({
      data: { type, status, summary, details: details as any },
    });
  }

  async runLowStockCheck() {
    try {
      const lowStock = await this.products.lowStock();
      const summary = lowStock.length
        ? `${lowStock.length} producto(s) con stock en o bajo el umbral de reorden`
        : 'Sin alertas de stock bajo';
      await this.log('LOW_STOCK_CHECK', 'SUCCESS', summary, {
        products: lowStock.map((p) => ({ id: p.id, name: p.name, sku: p.sku, stockQuantity: p.stockQuantity })),
      });
      return { summary, count: lowStock.length };
    } catch (error) {
      this.logger.error('Fallo en runLowStockCheck', error as Error);
      await this.log('LOW_STOCK_CHECK', 'FAILURE', (error as Error).message);
      throw error;
    }
  }

  async runInvoiceOverdueCheck() {
    try {
      const count = await this.invoices.markOverdue();
      const summary = count > 0 ? `${count} factura(s) marcadas como vencidas` : 'Sin facturas nuevas vencidas';
      await this.log('INVOICE_OVERDUE_CHECK', 'SUCCESS', summary, { count });
      return { summary, count };
    } catch (error) {
      this.logger.error('Fallo en runInvoiceOverdueCheck', error as Error);
      await this.log('INVOICE_OVERDUE_CHECK', 'FAILURE', (error as Error).message);
      throw error;
    }
  }

  async runDailyReport() {
    try {
      const forecast = await this.analytics.salesForecast();
      const stockRisk = await this.analytics.stockRiskAssessment();
      const financialSummary = await this.invoices.financialSummary();
      const insight = await this.analytics.narrativeInsight({ forecast, stockRisk, financialSummary });

      await this.log('DAILY_REPORT', 'SUCCESS', insight.slice(0, 500), {
        forecast,
        stockRisk,
        financialSummary,
      });
      return { insight, forecast, stockRisk, financialSummary };
    } catch (error) {
      this.logger.error('Fallo en runDailyReport', error as Error);
      await this.log('DAILY_REPORT', 'FAILURE', (error as Error).message);
      throw error;
    }
  }

  listLogs(type?: AutomationType) {
    return this.prisma.automationLog.findMany({
      where: type ? { type } : undefined,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
  }
}
