import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Customer, Opportunity, OpportunityStage } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label, Select, Textarea } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';

const STAGES: OpportunityStage[] = ['NEW', 'QUALIFIED', 'PROPOSAL', 'NEGOTIATION', 'WON', 'LOST'];

const STAGE_LABELS: Record<OpportunityStage, string> = {
  NEW: 'Nuevo',
  QUALIFIED: 'Calificado',
  PROPOSAL: 'Propuesta',
  NEGOTIATION: 'Negociacion',
  WON: 'Ganado',
  LOST: 'Perdido',
};

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function OpportunitiesPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: opportunities } = useQuery({
    queryKey: ['opportunities'],
    queryFn: async () => (await api.get<Opportunity[]>('/crm/opportunities')).data,
  });

  const { data: customers } = useQuery({
    queryKey: ['customers-all'],
    queryFn: async () => (await api.get<Customer[]>('/crm/customers')).data,
  });

  const createMutation = useMutation({
    mutationFn: (payload: any) => api.post('/crm/opportunities', payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunities'] });
      setOpen(false);
    },
  });

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: OpportunityStage }) =>
      api.patch(`/crm/opportunities/${id}`, { stage }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['opportunities'] }),
  });

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      title: String(formData.get('title')),
      customerId: String(formData.get('customerId')),
      value: Number(formData.get('value') || 0),
      notes: String(formData.get('notes') || '') || undefined,
    });
  };

  const grouped = STAGES.map((stage) => ({
    stage,
    items: (opportunities ?? []).filter((o) => o.stage === stage),
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Pipeline de oportunidades</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">CRM - embudo de ventas</p>
        </div>
        <Button onClick={() => setOpen(true)}>+ Nueva oportunidad</Button>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {grouped.map(({ stage, items }) => (
          <div key={stage}>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
              {STAGE_LABELS[stage]} ({items.length})
            </p>
            <div className="space-y-2">
              {items.map((o) => (
                <Card key={o.id}>
                  <CardBody className="space-y-2 p-3">
                    <p className="text-sm font-medium">{o.title}</p>
                    <p className="text-xs text-ink-muted">{o.customer?.name}</p>
                    <p className="text-sm font-semibold text-series-1">{currency.format(Number(o.value))}</p>
                    <Select
                      value={o.stage}
                      onChange={(e) => stageMutation.mutate({ id: o.id, stage: e.target.value as OpportunityStage })}
                      className="text-xs"
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABELS[s]}
                        </option>
                      ))}
                    </Select>
                  </CardBody>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Nueva oportunidad">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="title">Titulo *</Label>
            <Input id="title" name="title" required />
          </div>
          <div>
            <Label htmlFor="customerId">Cliente *</Label>
            <Select id="customerId" name="customerId" required defaultValue="">
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
          <div>
            <Label htmlFor="value">Valor estimado (USD)</Label>
            <Input id="value" name="value" type="number" min="0" step="0.01" defaultValue={0} />
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
