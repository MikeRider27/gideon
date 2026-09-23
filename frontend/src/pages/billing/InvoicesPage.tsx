import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Invoice } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody } from '../../components/ui/Card';
import { Input, Label } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import { Badge } from '../../components/ui/Badge';
import { StatTile } from '../../components/ui/StatTile';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });
const dateFmt = new Intl.DateTimeFormat('es');

const STATUS_TONE: Record<string, 'neutral' | 'good' | 'warning' | 'critical' | 'info'> = {
  DRAFT: 'neutral',
  SENT: 'info',
  PARTIALLY_PAID: 'warning',
  PAID: 'good',
  OVERDUE: 'critical',
  CANCELLED: 'neutral',
};

export function InvoicesPage() {
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => (await api.get<Invoice[]>('/billing/invoices')).data,
  });

  const { data: summary } = useQuery({
    queryKey: ['billing-summary'],
    queryFn: async () => (await api.get('/billing/invoices/reports/summary')).data,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['invoices'] });
    queryClient.invalidateQueries({ queryKey: ['billing-summary'] });
  };

  const paymentMutation = useMutation({
    mutationFn: ({ id, amount }: { id: string; amount: number }) =>
      api.post(`/billing/invoices/${id}/payments`, { amount }),
    onSuccess: () => {
      invalidate();
      setPayingInvoice(null);
    },
  });

  const handlePayment = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!payingInvoice) return;
    const formData = new FormData(e.currentTarget);
    paymentMutation.mutate({ id: payingInvoice.id, amount: Number(formData.get('amount')) });
  };

  const paidOf = (invoice: Invoice) => invoice.payments.reduce((sum, p) => sum + Number(p.amount), 0);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold">Facturacion</h1>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">Finanzas</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Facturado" value={summary ? currency.format(summary.totalInvoiced) : '-'} />
        <StatTile label="Cobrado" value={summary ? currency.format(summary.totalPaid) : '-'} />
        <StatTile label="Por cobrar" value={summary ? currency.format(summary.outstanding) : '-'} tone="warning" />
        <StatTile label="Vencidas" value={String(summary?.overdueCount ?? '-')} tone={summary?.overdueCount ? 'critical' : 'neutral'} />
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
                  <Th>Vencimiento</Th>
                  <Th>Total</Th>
                  <Th>Pagado</Th>
                  <Th>Estado</Th>
                  <Th></Th>
                </tr>
              </Thead>
              <tbody>
                {invoices?.map((i) => (
                  <Tr key={i.id}>
                    <Td>{i.code}</Td>
                    <Td>{i.customer?.name ?? '-'}</Td>
                    <Td>{dateFmt.format(new Date(i.dueDate))}</Td>
                    <Td>{currency.format(Number(i.total))}</Td>
                    <Td>{currency.format(paidOf(i))}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[i.status]}>{i.status}</Badge>
                    </Td>
                    <Td>
                      {i.status !== 'PAID' && i.status !== 'CANCELLED' && (
                        <button
                          className="text-xs font-medium text-series-1 hover:underline"
                          onClick={() => setPayingInvoice(i)}
                        >
                          Registrar pago
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

      <Modal open={!!payingInvoice} onClose={() => setPayingInvoice(null)} title={`Registrar pago - ${payingInvoice?.code ?? ''}`}>
        {payingInvoice && (
          <form onSubmit={handlePayment} className="space-y-3">
            <p className="text-sm text-ink-muted">
              Total: {currency.format(Number(payingInvoice.total))} · Pagado: {currency.format(paidOf(payingInvoice))} ·
              Pendiente: {currency.format(Number(payingInvoice.total) - paidOf(payingInvoice))}
            </p>
            <div>
              <Label htmlFor="amount">Monto a pagar *</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                min="0.01"
                step="0.01"
                max={Number(payingInvoice.total) - paidOf(payingInvoice)}
                required
              />
            </div>
            <Button type="submit" disabled={paymentMutation.isPending} className="w-full">
              {paymentMutation.isPending ? 'Procesando...' : 'Registrar pago'}
            </Button>
          </form>
        )}
      </Modal>
    </div>
  );
}
