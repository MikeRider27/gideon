import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Product, Supplier } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label, Select } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });

export function ProductsPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', search],
    queryFn: async () => (await api.get<Product[]>('/inventory/products', { params: { search: search || undefined } })).data,
  });

  const { data: suppliers } = useQuery({
    queryKey: ['suppliers-all'],
    queryFn: async () => (await api.get<Supplier[]>('/inventory/suppliers')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/products', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setOpen(false);
    },
  });

  const adjustMutation = useMutation({
    mutationFn: ({ id, quantity, note }: { id: string; quantity: number; note?: string }) =>
      api.patch(`/inventory/products/${id}/adjust-stock`, { quantity, note }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setAdjustProduct(null);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      sku: String(formData.get('sku')),
      name: String(formData.get('name')),
      unitPrice: Number(formData.get('unitPrice')),
      costPrice: Number(formData.get('costPrice') || 0),
      stockQuantity: Number(formData.get('stockQuantity') || 0),
      reorderThreshold: Number(formData.get('reorderThreshold') || 10),
      supplierId: String(formData.get('supplierId') || '') || undefined,
    });
  };

  const handleAdjust = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!adjustProduct) return;
    const formData = new FormData(e.currentTarget);
    adjustMutation.mutate({
      id: adjustProduct.id,
      quantity: Number(formData.get('quantity')),
      note: String(formData.get('note') || '') || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Productos</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Inventario</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nuevo producto</Button>
      </div>

      <Input placeholder="Buscar por nombre o SKU..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>SKU</Th>
                  <Th>Nombre</Th>
                  <Th>Precio</Th>
                  <Th>Stock</Th>
                  <Th>Proveedor</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {products?.map((p) => (
                  <Tr key={p.id}>
                    <Td>{p.sku}</Td>
                    <Td>{p.name}</Td>
                    <Td>{currency.format(Number(p.unitPrice))}</Td>
                    <Td>
                      <span className="flex items-center gap-2">
                        {p.stockQuantity}
                        {p.stockQuantity <= p.reorderThreshold && <Badge tone="critical">Stock bajo</Badge>}
                      </span>
                    </Td>
                    <Td>{p.supplier?.name ?? '-'}</Td>
                    <Td>
                      <button
                        className="text-xs font-medium text-series-1 hover:underline"
                        onClick={() => setAdjustProduct(p)}
                      >
                        Ajustar stock
                      </button>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo producto">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="sku">SKU *</Label>
              <Input id="sku" name="sku" required />
            </div>
            <div>
              <Label htmlFor="name">Nombre *</Label>
              <Input id="name" name="name" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="unitPrice">Precio de venta *</Label>
              <Input id="unitPrice" name="unitPrice" type="number" min="0" step="0.01" required />
            </div>
            <div>
              <Label htmlFor="costPrice">Costo</Label>
              <Input id="costPrice" name="costPrice" type="number" min="0" step="0.01" defaultValue={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="stockQuantity">Stock inicial</Label>
              <Input id="stockQuantity" name="stockQuantity" type="number" min="0" defaultValue={0} />
            </div>
            <div>
              <Label htmlFor="reorderThreshold">Umbral de reorden</Label>
              <Input id="reorderThreshold" name="reorderThreshold" type="number" min="0" defaultValue={10} />
            </div>
          </div>
          <div>
            <Label htmlFor="supplierId">Proveedor</Label>
            <Select id="supplierId" name="supplierId" defaultValue="">
              <option value="">Sin proveedor</option>
              {suppliers?.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </Modal>

      <Modal open={!!adjustProduct} onClose={() => setAdjustProduct(null)} title={`Ajustar stock - ${adjustProduct?.name ?? ''}`}>
        <form onSubmit={handleAdjust} className="space-y-3">
          <p className="text-sm text-ink-muted">Stock actual: {adjustProduct?.stockQuantity}</p>
          <div>
            <Label htmlFor="quantity">Cantidad (usa negativo para restar)</Label>
            <Input id="quantity" name="quantity" type="number" required />
          </div>
          <div>
            <Label htmlFor="note">Motivo</Label>
            <Input id="note" name="note" placeholder="Ej. conteo fisico, merma, ajuste" />
          </div>
          <Button type="submit" disabled={adjustMutation.isPending} className="w-full">
            {adjustMutation.isPending ? 'Aplicando...' : 'Aplicar ajuste'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
