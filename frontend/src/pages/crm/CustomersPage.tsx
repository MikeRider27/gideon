import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Customer } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

export function CustomersPage() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', search],
    queryFn: async () => (await api.get<Customer[]>('/crm/customers', { params: { search: search || undefined } })).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: Partial<Customer>) => api.post('/crm/customers', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
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
      company: String(formData.get('company') || '') || undefined,
      notes: String(formData.get('notes') || '') || undefined,
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Clientes</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">CRM - base de clientes</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nuevo cliente</Button>
      </div>

      <Input placeholder="Buscar por nombre, empresa o correo..." value={search} onChange={(e) => setSearch(e.target.value)} />

      <Card>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Nombre</Th>
                  <Th>Empresa</Th>
                  <Th>Correo</Th>
                  <Th>Telefono</Th>
                </tr>
              </Thead>
              <tbody>
                {customers?.map((c) => (
                  <Tr key={c.id}>
                    <Td>
                      <Link to={`/crm/customers/${c.id}`} className="font-medium text-series-1 hover:underline">
                        {c.name}
                      </Link>
                    </Td>
                    <Td>{c.company ?? '-'}</Td>
                    <Td>{c.email ?? '-'}</Td>
                    <Td>{c.phone ?? '-'}</Td>
                  </Tr>
                ))}
                {customers?.length === 0 && (
                  <tr>
                    <Td className="text-ink-muted">No hay clientes registrados.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Nuevo cliente">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="name">Nombre *</Label>
            <Input id="name" name="name" required />
          </div>
          <div>
            <Label htmlFor="company">Empresa</Label>
            <Input id="company" name="company" />
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
            <Label htmlFor="notes">Notas</Label>
            <Textarea id="notes" name="notes" rows={3} />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="w-full">
            {createMutation.isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </form>
      </Modal>
    </div>
  );
}
