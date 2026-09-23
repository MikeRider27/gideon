import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { SuppliersService } from './suppliers.service';
import { SuppliersController } from './suppliers.controller';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';

@Module({
  providers: [ProductsService, SuppliersService, PurchaseOrdersService],
  controllers: [ProductsController, SuppliersController, PurchaseOrdersController],
  exports: [ProductsService, SuppliersService, PurchaseOrdersService],
})
export class InventoryModule {}
