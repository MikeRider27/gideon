import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, CreatePaymentDto } from './dto/invoice.dto';

@UseGuards(JwtAuthGuard)
@Controller('billing/invoices')
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Post()
  create(@Body() dto: CreateInvoiceDto) {
    return this.invoicesService.create(dto);
  }

  @Get()
  findAll(@Query('status') status?: string) {
    return this.invoicesService.findAll(status);
  }

  @Get('reports/summary')
  summary() {
    return this.invoicesService.financialSummary();
  }

  @Get('reports/overdue')
  overdue() {
    return this.invoicesService.overdue();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }

  @Post(':id/payments')
  addPayment(@Param('id') id: string, @Body() dto: CreatePaymentDto) {
    return this.invoicesService.addPayment(id, dto);
  }

  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.invoicesService.cancel(id);
  }
}
