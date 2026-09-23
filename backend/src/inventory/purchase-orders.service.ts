import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto, ReceivePurchaseOrderDto } from './dto/purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(private prisma: PrismaService) {}

  private async nextCode() {
    const count = await this.prisma.purchaseOrder.count();
    return `PO-${String(count + 1).padStart(5, '0')}`;
  }

  async create(dto: CreatePurchaseOrderDto) {
    const code = await this.nextCode();
    return this.prisma.purchaseOrder.create({
      data: {
        code,
        supplierId: dto.supplierId,
        notes: dto.notes,
        status: 'ORDERED',
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitCost: item.unitCost,
          })),
        },
      },
      include: { items: { include: { product: true } }, supplier: true },
    });
  }

  findAll(status?: string) {
    return this.prisma.purchaseOrder.findMany({
      where: status ? { status: status as any } : undefined,
      include: { supplier: true, items: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const order = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: { supplier: true, items: { include: { product: true } } },
    });
    if (!order) throw new NotFoundException('Orden de compra no encontrada');
    return order;
  }

  async receive(id: string, dto: ReceivePurchaseOrderDto) {
    const order = await this.findOne(id);
    if (order.status === 'RECEIVED' || order.status === 'CANCELLED') {
      throw new BadRequestException('La orden ya esta cerrada');
    }

    return this.prisma.$transaction(async (tx) => {
      for (const receivedItem of dto.items) {
        const item = order.items.find((i) => i.id === receivedItem.itemId);
        if (!item) throw new BadRequestException(`Item ${receivedItem.itemId} no pertenece a esta orden`);

        const remaining = item.quantity - item.quantityReceived;
        if (receivedItem.quantity > remaining) {
          throw new BadRequestException(`Cantidad recibida excede lo pendiente para ${item.productId}`);
        }

        await tx.purchaseOrderItem.update({
          where: { id: item.id },
          data: { quantityReceived: { increment: receivedItem.quantity } },
        });

        await tx.product.update({
          where: { id: item.productId },
          data: { stockQuantity: { increment: receivedItem.quantity } },
        });

        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            type: 'PURCHASE_IN',
            quantity: receivedItem.quantity,
            note: `Recepcion de orden ${order.code}`,
          },
        });
      }

      const updatedItems = await tx.purchaseOrderItem.findMany({ where: { purchaseOrderId: id } });
      const fullyReceived = updatedItems.every((i) => i.quantityReceived >= i.quantity);
      const partiallyReceived = updatedItems.some((i) => i.quantityReceived > 0);

      const status = fullyReceived ? 'RECEIVED' : partiallyReceived ? 'PARTIALLY_RECEIVED' : order.status;

      return tx.purchaseOrder.update({
        where: { id },
        data: { status },
        include: { items: { include: { product: true } }, supplier: true },
      });
    });
  }

  async cancel(id: string) {
    const order = await this.findOne(id);
    if (order.status === 'RECEIVED') {
      throw new BadRequestException('No se puede cancelar una orden ya recibida');
    }
    return this.prisma.purchaseOrder.update({ where: { id }, data: { status: 'CANCELLED' } });
  }
}
