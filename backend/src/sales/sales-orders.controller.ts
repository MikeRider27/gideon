import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { SalesOrdersService } from './sales-orders.service';
import { CreateSalesOrderDto } from './dto/sales-order.dto';

@UseGuards(JwtAuthGuard)
@Controller('sales/orders')
export class SalesOrdersController {
  constructor(private salesOrdersService: SalesOrdersService) {}

  @Post()
  create(@Body() dto: CreateSalesOrderDto, @CurrentUser() user: { userId: string }) {
    return this.salesOrdersService.create(dto, user.userId);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.salesOrdersService.findAll(status);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesOrdersService.findOne(id);
  }

  @Patch(':id/confirm')
  confirm(@Param('id') id: string) {
    return this.salesOrdersService.confirm(id);
  }

  @Patch(':id/fulfill')
  fulfill(@Param('id') id: string) {
    return this.salesOrdersService.fulfill(id);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.salesOrdersService.cancel(id);
  }

  @Post(':id/invoice')
  generateInvoice(@Param('id') id: string) {
    return this.salesOrdersService.generateInvoice(id);
  }
}
