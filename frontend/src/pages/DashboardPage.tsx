import { useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../lib/api';
import { DashboardSummary, SalesTrendPoint } from '../lib/types';
import { StatTile } from '../components/ui/StatTile';
import { Card, CardBody, CardHeader } from '../components/ui/Card';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

export function DashboardPage() {
  const { data: summary } = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => (await api.get<DashboardSummary>('/dashboard/summary')).data,
  });

  const { data: trend } = useQuery({
    queryKey: ['dashboard-sales-trend'],
    queryFn: async () => (await api.get<SalesTrendPoint[]>('/dashboard/sales-trend', { params: { days: 30 } })).data,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Vision general del negocio en tiempo real
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatTile label="Clientes" value={String(summary?.customerCount ?? '-')} />
        <StatTile label="Ingresos (ventas)" value={summary ? currency.format(summary.revenue) : '-'} />
        <StatTile label="Pipeline abierto" value={summary ? currency.format(summary.pipelineValue) : '-'} hint={`${summary?.openOpportunitiesCount ?? 0} oportunidades`} />
        <StatTile
          label="Cuentas por cobrar"
          value={summary ? currency.format(summary.outstandingReceivables) : '-'}
          tone={summary && summary.overdueInvoicesCount > 0 ? 'warning' : 'neutral'}
          hint={`${summary?.overdueInvoicesCount ?? 0} facturas vencidas`}
        />
        <StatTile label="Productos" value={String(summary?.productCount ?? '-')} />
        <StatTile
          label="Stock bajo"
          value={String(summary?.lowStockCount ?? '-')}
          tone={summary && summary.lowStockCount > 0 ? 'critical' : 'neutral'}
        />
        <StatTile label="Ordenes de venta" value={String(summary?.salesOrdersCount ?? '-')} />
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Ventas - ultimos 30 dias</h2>
        </CardHeader>
        <CardBody>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend ?? []} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid vertical={false} stroke="#e1e0d9" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: '#898781' }}
                  axisLine={{ stroke: '#c3c2b7' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#898781' }}
                  axisLine={false}
                  tickLine={false}
                  width={60}
                  tickFormatter={(v) => currency.format(v)}
                />
                <Tooltip
                  formatter={(value: number) => currency.format(value)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e1e0d9' }}
                />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Ventas"
                  stroke="#2a78d6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          {(!trend || trend.length === 0) && (
            <p className="mt-2 text-sm text-ink-muted">Aun no hay ventas confirmadas en este periodo.</p>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
