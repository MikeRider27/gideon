import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalesOrderDto } from './dto/sales-order.dto';

@Injectable()
export class SalesOrdersService {
  constructor(private prisma: PrismaService) {}

  private async nextCode() {
    const count = await this.prisma.salesOrder.count();
    return `SO-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreateSalesOrderDto, ownerId?: string) {
    const products = await this.prisma.product.findMany({
      where: { id: { in: dto.items.map((i) => i.productId) } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    for (const item of dto.items) {
      if (!productMap.has(item.productId)) {
        throw new BadRequestException(`Producto ${item.productId} no existe`);
      }
    }

    const code = await this.nextCode();
    return this.prisma.salesOrder.create({
      data: {
        code,
        customerId: dto.customerId,
        notes: dto.notes,
        ownerId,
        status: 'DRAFT',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice ?? productMap.get(item.productId)!.unitPrice,
          })),
        },
      },
      include: { items: { include: { product: true } }, customer: true },
    });
  }

  findAll(status?: string) {
    return this.prisma.salesOrder.findMany({
      where: status ? { status: status as any } : undefined,
      include: { customer: true, items: true, owner: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: { customer: true, items: { include: { product: true } }, owner: true, invoices: true },
    });
    if (!order) throw new NotFoundException('Orden de venta no encontrada');
    return order;
  }

  private total(items: { quantity: number; unitPrice: any }[]) {
    return items.reduce((sum, item) => sum + item.quantity * Number(item.unitPrice), 0);
  }

  async confirm(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'DRAFT') {
      throw new BadRequestException('Solo se pueden confirmar ordenes en borrador');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (!product || product.stockQuantity < item.quantity) {
          throw new BadRequestException(`Stock insuficiente para ${product?.name ?? item.productId}`);
        }
        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { decrement: item.quantity } },
        });
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'SALE_OUT',
            quantity: -item.quantity,
            note: `Venta ${order.code}`,
          },
        });
      }
      return tx.salesOrder.update({
        where: { id },
        data: { status: 'CONFIRMED' },
        include: { items: { include: { product: true } }, customer: true },
      });
    });
  }

  async fulfill(id: string) {
    const order = await this.findOne(id);
    if (order.status !== 'CONFIRMED') {
      throw new BadRequestException('Solo se pueden entregar ordenes confirmadas');
    }
    return this.prisma.salesOrder.update({ where: { id }, data: { status: 'FULFILLED' } });
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.status === 'CANCELLED') return order;

    return this.prisma.$transaction(async (tx) => {
      if (order.status === 'CONFIRMED' || order.status === 'FULFILLED') {
        for (const item of order.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { stockQuantity: { increment: item.quantity } },
          });
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: 'ADJUSTMENT',
              quantity: item.quantity,
              note: `Cancelacion de venta ${order.code}`,
            },
          });
        }
      }
      return tx.salesOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
    });
  }

  async generateInvoice(id: string, dueInDays = 30) {
    const order = await this.findOne(id);
    if (order.status === 'DRAFT' || order.status === 'CANCELLED') {
      throw new BadRequestException('La orden debe estar confirmada o entregada para facturar');
    }

    const total = this.total(order.items);
    const count = await this.prisma.invoice.count();
    const code = `INV-${String(count + 1).padStart(5, '0')}`;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueInDays);

    return this.prisma.invoice.create({
      data: {
        code,
        customerId: order.customerId,
        salesOrderId: order.id,
        total,
        dueDate,
        status: 'SENT',
      },
    });
  }
}
