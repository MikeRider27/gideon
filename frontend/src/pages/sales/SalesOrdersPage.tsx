import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Customer, Product, SalesOrder } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });

const STATUS_TONE: Record<string, 'neutral' | 'good' | 'warning' | 'critical' | 'info'> = {
  DRAFT: 'neutral',
  CONFIRMED: 'info',
  FULFILLED: 'good',
  CANCELLED: 'critical',
};

interface DraftItem {
  productId: string;
  quantity: number;
}

function orderTotal(order: SalesOrder) {
  return order.items.reduce((sum, i) => sum + i.quantity * Number(i.unitPrice), 0);
}

export function SalesOrdersPage() {
  const [open, setOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', quantity: 1 }]);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['sales-orders'],
    queryFn: async () => (await api.get<SalesOrder[]>('/sales/orders')).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => (await api.get<Customer[]>('/crm/customers')).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => (await api.get<Product[]>('/inventory/products')).data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-summary'] });
  };

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/sales/orders', payload),
    onSuccess: () => {
      invalidate();
      setOpen(false);
      setItems([{ productId: '', quantity: 1 }]);
      setCustomerId('');
    },
  });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/sales/orders/${id}/confirm`),
    onSuccess: invalidate,
  });
  const fulfillMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/sales/orders/${id}/fulfill`),
    onSuccess: invalidate,
  });
  const cancelMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/sales/orders/${id}/cancel`),
    onSuccess: invalidate,
  });
  const invoiceMutation = useMutation({
    mutationFn: (id: string) => api.post(`/sales/orders/${id}/invoice`),
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate({ customerId, items: items.filter((i) => i.productId && i.quantity > 0) });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ordenes de venta</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Ventas</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nueva venta</Button>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Codigo</Th>
                  <Th>Cliente</Th>
                  <Th>Total</Th>
                  <Th>Estado</Th>
                  <Th>Acciones</Th>
                </tr>
              </Thead>
              <tbody>
                {orders?.map((o) => (
                  <Tr key={o.id}>
                    <Td>{o.code}</Td>
                    <Td>{o.customer?.name ?? '-'}</Td>
                    <Td>{currency.format(orderTotal(o))}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                    </Td>
                    <Td>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {o.status === 'DRAFT' && (
                          <>
                            <button className="text-series-1 hover:underline" onClick={() => confirmMutation.mutate(o.id)}>
                              Confirmar
                            </button>
                            <button className="text-status-critical hover:underline" onClick={() => cancelMutation.mutate(o.id)}>
                              Cancelar
                            </button>
                          </>
                        )}
                        {o.status === 'CONFIRMED' && (
                          <>
                            <button className="text-series-1 hover:underline" onClick={() => fulfillMutation.mutate(o.id)}>
                              Marcar entregada
                            </button>
                            <button className="text-series-1 hover:underline" onClick={() => invoiceMutation.mutate(o.id)}>
                              Facturar
                            </button>
                            <button className="text-status-critical hover:underline" onClick={() => cancelMutation.mutate(o.id)}>
                              Cancelar
                            </button>
                          </>
                        )}
                        {o.status === 'FULFILLED' && (
                          <button className="text-series-1 hover:underline" onClick={() => invoiceMutation.mutate(o.id)}>
                            Facturar
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva orden de venta">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="customerId">Cliente *</Label>
            <Select id="customerId" value={customerId} onChange={(e) => setCustomerId(e.target.value)} required>
              <option value="" disabled>
                Selecciona un cliente
              </option>
              {customers?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_auto] gap-2">
                <Select
                  value={item.productId}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].productId = e.target.value;
                    setItems(next);
                  }}
                  required
                >
                  <option value="" disabled>
                    Producto
                  </option>
                  {products?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} - {p.name} (stock: {p.stockQuantity})
                    </option>
                  ))}
                </Select>
                <Input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].quantity = Number(e.target.value);
                    setItems(next);
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setItems(items.filter((_, i) => i !== idx))}
                  disabled={items.length === 1}
                >
                  ✕
                </Button>
              </div>
            ))}
            <Button type="button" variant="secondary" onClick={() => setItems([...items, { productId: '', quantity: 1 }])}>
              + Agregar item
            </Button>
          </div>

          {createMutation.isError && (
            <p className="text-sm text-status-critical">
              {(createMutation.error as any)?.response?.data?.message ?? 'Error al crear la orden'}
            </p>
          )}

          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Guardando...' : 'Crear orden (borrador)'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
