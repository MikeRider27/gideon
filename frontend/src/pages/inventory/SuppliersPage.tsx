import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Supplier } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

export function SuppliersPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: suppliers, isLoading } = useQuery({
    queryKey: ['suppliers'],
    queryFn: async () => (await api.get<Supplier[]>('/inventory/suppliers')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/inventory/suppliers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      queryClient.invalidateQueries({ queryKey: ['suppliers-all'] });
      setOpen(false);
    },
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: String(formData.get('name')),
      email: String(formData.get('email') || '') || undefined,
      phone: String(formData.get('phone') || '') || undefined,
      address: String(formData.get('address') || '') || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Proveedores</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Inventario y compras</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nuevo proveedor</Button>
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Correo</Th>
                  <Th>Telefono</Th>
                </tr>
              </Thead>
              <tbody>
                {suppliers?.map((s) => (
                  <Tr key={s.id}>
                    <Td>{s.name}</Td>
                    <Td>{s.email ?? '-'}</Td>
                    <Td>{s.phone ?? '-'}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo proveedor">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Correo</Label>
              <Input id="email" name="email" type="email" />
            </div>
            <div>
              <Label htmlFor="phone">Telefono</Label>
              <Input id="phone" name="phone" />
            </div>
          </div>
          <div>
            <Label htmlFor="address">Direccion</Label>
            <Input id="address" name="address" />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
