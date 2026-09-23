import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/invoice.dto';

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async nextCode() {
    const count = await this.prisma.invoice.count();
    return `INV-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateInvoiceDto) {
    const code = await this.nextCode();
    return this.prisma.invoice.create({
      data: {
        code,
        customerId: dto.customerId,
        total: dto.total,
        dueDate: new Date(dto.dueDate),
        notes: dto.notes,
        status: 'SENT',
      },
    });
  }

  findAll(status?: string) {
    return this.prisma.invoice.findMany({
      where: status ? { status: status as any } : undefined,
      include: { customer: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { customer: true, payments: true, salesOrder: true },
    });
    if (!invoice) throw new NotFoundException('Factura no encontrada');
    return invoice;
  }

  async overdue() {
    return this.prisma.invoice.findMany({
      where: {
        dueDate: { lt: new Date() },
        status: { in: ['SENT', 'PARTIALLY_PAID'] },
      },
      include: { customer: true },
    });
  }

  async markOverdue() {
    const result = await this.prisma.invoice.updateMany({
      where: { dueDate: { lt: new Date() }, status: { in: ['SENT', 'PARTIALLY_PAID'] } },
      data: { status: 'OVERDUE' },
    });
    return result.count;
  }

  async addPayment(id: string, dto: CreatePaymentDto) {
    const invoice = await this.findOne(id);
    if (invoice.status === 'PAID' || invoice.status === 'CANCELLED') {
      throw new BadRequestException('La factura ya esta cerrada');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: { invoiceId: id, amount: dto.amount, method: dto.method ?? 'transfer' },
      });

      const payments = await tx.payment.findMany({ where: { invoiceId: id } });
      const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
      const status = totalPaid >= Number(invoice.total) ? 'PAID' : 'PARTIALLY_PAID';

      return tx.invoice.update({
        where: { id },
        data: { status },
        include: { payments: true, customer: true },
      });
    });
  }

  async cancel(id: string) {
    await this.findOne(id);
    return this.prisma.invoice.update({ where: { id }, data: { status: 'CANCELLED' } });
  }

  async financialSummary() {
    const invoices = await this.prisma.invoice.findMany({ include: { payments: true } });
    const totalInvoiced = invoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalPaid = invoices.reduce(
      (sum, i) => sum + i.payments.reduce((s, p) => s + Number(p.amount), 0),
      0,
    );
    const outstanding = totalInvoiced - totalPaid;
    const overdueCount = invoices.filter((i) => i.status === 'OVERDUE').length;

    return { totalInvoiced, totalPaid, outstanding, overdueCount, invoiceCount: invoices.length };
  }
}
