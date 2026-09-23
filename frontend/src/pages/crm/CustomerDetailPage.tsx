import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD' });

export function CustomerDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: customer, isLoading } = useQuery({
    queryKey: ['customer', id],
    queryFn: async () => (await api.get(`/crm/customers/${id}`)).data,
  });

  if (isLoading) return <p className="text-sm text-ink-muted">Cargando...</p>;
  if (!customer) return <p className="text-sm text-ink-muted">Cliente no encontrado.</p>;

  return (
    <div className="space-y-4">
      <div>
        <Link to="/crm/customers" className="text-xs text-series-1 hover:underline">
          &larr; Volver a clientes
        </Link>
        <h1 className="text-xl font-semibold">{customer.name}</h1>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          {customer.company ?? 'Sin empresa'} · {customer.email ?? 'sin correo'} · {customer.phone ?? 'sin telefono'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Oportunidades</h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {customer.opportunities?.length ? (
            customer.opportunities.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <span>{o.title}</span>
                <span className="flex items-center gap-2">
                  <Badge tone="info">{o.stage}</Badge>
                  <span>{currency.format(Number(o.value))}</span>
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-muted">Sin oportunidades registradas.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Ordenes de venta</h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {customer.salesOrders?.length ? (
            customer.salesOrders.map((o: any) => (
              <div key={o.id} className="flex items-center justify-between text-sm">
                <span>{o.code}</span>
                <Badge tone="info">{o.status}</Badge>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-muted">Sin ordenes de venta.</p>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Facturas</h2>
        </CardHeader>
        <CardBody className="space-y-2">
          {customer.invoices?.length ? (
            customer.invoices.map((i: any) => (
              <div key={i.id} className="flex items-center justify-between text-sm">
                <span>{i.code}</span>
                <span className="flex items-center gap-2">
                  <Badge tone={i.status === 'OVERDUE' ? 'critical' : i.status === 'PAID' ? 'good' : 'neutral'}>
                    {i.status}
                  </Badge>
                  <span>{currency.format(Number(i.total))}</span>
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-ink-muted">Sin facturas.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
