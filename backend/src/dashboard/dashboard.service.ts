import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async summary() {
    const [customerCount, productCount, openOpportunities, salesOrders, invoices, lowStockProducts] =
      await Promise.all([
        this.prisma.customer.count(),
        this.prisma.product.count(),
        this.prisma.opportunity.findMany({ where: { stage: { notIn: ['WON', 'LOST'] } } }),
        this.prisma.salesOrder.findMany({ include: { items: true } }),
        this.prisma.invoice.findMany({ include: { payments: true } }),
        this.prisma.product.findMany(),
      ]);

    const pipelineValue = openOpportunities.reduce((sum, o) => sum + Number(o.value), 0);
    const revenue = salesOrders
      .filter((o) => o.status !== 'CANCELLED' && o.status !== 'DRAFT')
      .reduce((sum, o) => sum + o.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0), 0);

    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalPaid = invoices.reduce(
      (sum, i) => sum + i.payments.reduce((s, p) => s + Number(p.amount), 0),
      0,
    );

    const lowStockCount = lowStockProducts.filter((p) => p.stockQuantity <= p.reorderThreshold).length;

    return {
      customerCount,
      productCount,
      openOpportunitiesCount: openOpportunities.length,
      pipelineValue,
      revenue,
      outstandingReceivables: totalInvoiced - totalPaid,
      overdueInvoicesCount: invoices.filter((i) => i.status === 'OVERDUE').length,
      lowStockCount,
      salesOrdersCount: salesOrders.length,
    };
  }

  async salesTrend(days = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const orders = await this.prisma.salesOrder.findMany({
      where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
      include: { items: true },
      orderBy: { createdAt: 'asc' },
    });

    const byDay = new Map<string, number>();
    for (const order of orders) {
      const day = order.createdAt.toISOString().slice(0, 10);
      const total = order.items.reduce((s, i) => s + i.quantity * Number(i.unitPrice), 0);
      byDay.set(day, (byDay.get(day) ?? 0) + total);
    }

    return Array.from(byDay.entries()).map(([date, total]) => ({ date, total }));
  }
}
