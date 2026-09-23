import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Product, PurchaseOrder, Supplier } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });

const STATUS_TONE: Record<string, 'neutral' | 'good' | 'warning' | 'critical' | 'info'> = {
  DRAFT: 'neutral',
  ORDERED: 'info',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'good',
  CANCELLED: 'critical',
};

interface DraftItem {
  productId: string;
  quantity: number;
  unitCost: number;
}

export function PurchaseOrdersPage() {
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState('');
  const [items, setItems] = useState<DraftItem[]>([{ productId: '', quantity: 1, unitCost: 0 }]);
  const [receivingOrder, setReceivingOrder] = useState<PurchaseOrder | null>(null);
  const queryClient = useQueryClient();

  const { data: orders, isLoading } = useQuery({
    queryKey: ['purchase-orders'],
    queryFn: async () => (await api.get<PurchaseOrder[]>('/inventory/purchase-orders')).data,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: async () => (await api.get<Supplier[]>('/inventory/suppliers')).data,
  });

  const { data: products } = useQuery({
    queryKey: ['products-all'],
    queryFn: async () => (await api.get<Product[]>('/inventory/products')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/purchase-orders', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      setOpen(false);
      setItems([{ productId: '', quantity: 1, unitCost: 0 }]);
      setSupplierId('');
    },
  });

  const receiveMutation = useMutation({
    mutationFn: ({ id, items }: { id: string; items: { itemId: string; quantity: number }[] }) =>
      api.patch(`/inventory/purchase-orders/${id}/receive`, { items }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setReceivingOrder(null);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    createMutation.mutate({
      supplierId,
      items: items.filter((i) => i.productId && i.quantity > 0),
    });
  };

  const handleReceive = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!receivingOrder) return;
    const formData = new FormData(e.currentTarget);
    const receiveItems = receivingOrder.items
      .map((item) => ({ itemId: item.id, quantity: Number(formData.get(`qty_${item.id}`) || 0) }))
      .filter((i) => i.quantity > 0);
    receiveMutation.mutate({ id: receivingOrder.id, items: receiveItems });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Ordenes de compra</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Inventario y compras</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nueva orden</Button>
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
                  <Th>Proveedor</Th>
                  <Th>Estado</Th>
                  <Th>Items</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {orders?.map((o) => (
                  <Tr key={o.id}>
                    <Td>{o.code}</Td>
                    <Td>{o.supplier?.name ?? '-'}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[o.status]}>{o.status}</Badge>
                    </Td>
                    <Td>{o.items.length}</Td>
                    <Td>
                      {(o.status === 'ORDERED' || o.status === 'PARTIALLY_RECEIVED') && (
                        <button
                          className="text-xs font-medium text-series-1 hover:underline"
                          onClick={async () => {
                            const { data } = await api.get(`/inventory/purchase-orders/${o.id}`);
                            setReceivingOrder(data);
                          }}
                        >
                          Recibir
                        </button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva orden de compra">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="supplierId">Proveedor *</Label>
            <Select id="supplierId" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
              <option value="" disabled>
                Selecciona un proveedor
              </option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Items</Label>
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_80px_100px_auto] gap-2">
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
                      {p.sku} - {p.name}
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
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Costo"
                  value={item.unitCost}
                  onChange={(e) => {
                    const next = [...items];
                    next[idx].unitCost = Number(e.target.value);
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
            <Button
              type="button"
              variant="secondary"
              onClick={() => setItems([...items, { productId: '', quantity: 1, unitCost: 0 }])}
            >
              + Agregar item
            </Button>
          </div>

          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Guardando...' : 'Crear orden'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!receivingOrder} onClose={() => setReceivingOrder(null)} title={`Recibir mercancia - ${receivingOrder?.code ?? ''}`}>
        {receivingOrder && (
          <form onSubmit={handleReceive} className="space-y-3">
            {receivingOrder.items.map((item) => {
              const pending = item.quantity - item.quantityReceived;
              return (
                <div key={item.id} className="flex items-center justify-between gap-3">
                  <div className="text-sm">
                    <p className="font-medium">{item.product?.name ?? item.productId}</p>
                    <p className="text-xs text-ink-muted">Pendiente: {pending}</p>
                  </div>
                  <Input
                    name={`qty_${item.id}`}
                    type="number"
                    min="0"
                    max={pending}
                    defaultValue={pending}
                    className="w-24"
                  />
                </div>
              );
            })}
            <Button type="submit" disabled={receiveMutation.isPending} className="w-full">
              {receiveMutation.isPending ? 'Procesando...' : 'Confirmar recepcion'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
