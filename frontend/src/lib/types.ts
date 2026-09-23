export type Role = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  address?: string | null;
  notes?: string | null;
  createdAt: string;
}

export type OpportunityStage = 'NEW' | 'QUALIFIED' | 'PROPOSAL' | 'NEGOTIATION' | 'WON' | 'LOST';

export interface Opportunity {
  id: string;
  title: string;
  stage: OpportunityStage;
  value: string;
  expectedCloseDate?: string | null;
  notes?: string | null;
  customerId: string;
  customer?: Customer;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  description?: string | null;
  unitPrice: string;
  costPrice: string;
  stockQuantity: number;
  reorderThreshold: number;
  supplierId?: string | null;
  supplier?: Supplier | null;
}

export type PurchaseOrderStatus = 'DRAFT' | 'ORDERED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrderItem {
  id: string;
  quantity: number;
  quantityReceived: number;
  unitCost: string;
  productId: string;
  product?: Product;
}

export interface PurchaseOrder {
  id: string;
  code: string;
  status: PurchaseOrderStatus;
  notes?: string | null;
  supplierId: string;
  supplier?: Supplier;
  items: PurchaseOrderItem[];
  createdAt: string;
}

export type SalesOrderStatus = 'DRAFT' | 'CONFIRMED' | 'FULFILLED' | 'CANCELLED';

export interface SalesOrderItem {
  id: string;
  quantity: number;
  unitPrice: string;
  productId: string;
  product?: Product;
}

export interface SalesOrder {
  id: string;
  code: string;
  status: SalesOrderStatus;
  notes?: string | null;
  customerId: string;
  customer?: Customer;
  items: SalesOrderItem[];
  createdAt: string;
}

export type InvoiceStatus = 'DRAFT' | 'SENT' | 'PARTIALLY_PAID' | 'PAID' | 'OVERDUE' | 'CANCELLED';

export interface Payment {
  id: string;
  amount: string;
  method: string;
  paidAt: string;
}

export interface Invoice {
  id: string;
  code: string;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string;
  total: string;
  customerId: string;
  customer?: Customer;
  payments: Payment[];
  createdAt: string;
}

export interface DashboardSummary {
  customerCount: number;
  productCount: number;
  openOpportunitiesCount: number;
  pipelineValue: number;
  revenue: number;
  outstandingReceivables: number;
  overdueInvoicesCount: number;
  lowStockCount: number;
  salesOrdersCount: number;
}

export interface SalesTrendPoint {
  date: string;
  total: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

export interface AutomationLog {
  id: string;
  type: 'LOW_STOCK_CHECK' | 'INVOICE_OVERDUE_CHECK' | 'DAILY_REPORT';
  status: 'SUCCESS' | 'FAILURE' | 'SKIPPED';
  summary: string;
  details?: unknown;
  createdAt: string;
}
