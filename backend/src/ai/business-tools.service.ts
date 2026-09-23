import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { CustomersService } from '../crm/customers.service';
import { ProductsService } from '../inventory/products.service';
import { InvoicesService } from '../billing/invoices.service';
import { DashboardService } from '../dashboard/dashboard.service';
import { OpportunitiesService } from '../crm/opportunities.service';

export const BUSINESS_TOOLS: Anthropic.Tool[] = [
  {
    name: 'get_dashboard_summary',
    description: 'Obtiene los KPIs generales del negocio: clientes, ventas, ingresos, cuentas por cobrar, stock bajo.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'search_customers',
    description: 'Busca clientes por nombre, empresa o correo.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Texto de busqueda' } },
      required: ['query'],
    },
  },
  {
    name: 'search_products',
    description: 'Busca productos del inventario por nombre o SKU.',
    input_schema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Texto de busqueda' } },
      required: ['query'],
    },
  },
  {
    name: 'list_low_stock_products',
    description: 'Lista los productos cuyo stock esta en o por debajo del umbral de reorden.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_overdue_invoices',
    description: 'Lista las facturas vencidas y sin pagar completamente.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_sales_pipeline',
    description: 'Obtiene el resumen del pipeline de oportunidades de venta (CRM) agrupado por etapa.',
    input_schema: { type: 'object', properties: {} },
  },
];

@Injectable()
export class BusinessToolsService {
  constructor(
    private customers: CustomersService,
    private products: ProductsService,
    private invoices: InvoicesService,
    private dashboard: DashboardService,
    private opportunities: OpportunitiesService,
  ) {}

  async execute(toolName: string, input: Record<string, any>): Promise<unknown> {
    switch (toolName) {
      case 'get_dashboard_summary':
        return this.dashboard.summary();
      case 'search_customers':
        return this.customers.findAll(input.query);
      case 'search_products':
        return this.products.findAll(input.query);
      case 'list_low_stock_products':
        return this.products.lowStock();
      case 'list_overdue_invoices':
        return this.invoices.overdue();
      case 'get_sales_pipeline':
        return this.opportunities.pipelineSummary();
      default:
        return { error: `Herramienta desconocida: ${toolName}` };
    }
  }
}
