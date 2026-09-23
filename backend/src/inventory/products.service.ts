import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustStockDto, CreateProductDto, UpdateProductDto } from './dto/product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { sku: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: { supplier: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { supplier: true, stockMovements: { orderBy: { createdAt: 'desc' }, take: 20 } },
    });
    if (!product) throw new NotFoundException('Producto no encontrado');
    return product;
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.product.delete({ where: { id } });
    return { success: true };
  }

  async lowStock() {
    const products = await this.prisma.product.findMany({ include: { supplier: true } });
    return products.filter((p) => p.stockQuantity <= p.reorderThreshold);
  }

  async adjustStock(id: string, dto: AdjustStockDto) {
    const product = await this.findOne(id);
    const newQuantity = product.stockQuantity + dto.quantity;
    if (newQuantity < 0) {
      throw new BadRequestException('El ajuste dejaria el stock en negativo');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.stockMovement.create({
        data: {
          productId: id,
          type: 'ADJUSTMENT',
          quantity: dto.quantity,
          note: dto.note,
        },
      });
      return tx.product.update({ where: { id }, data: { stockQuantity: newQuantity } });
    });
  }
}
