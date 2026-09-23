import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { api } from '../../lib/api';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';

const currency = new Intl.NumberFormat('es', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 });

const RISK_TONE: Record<string, 'critical' | 'serious' | 'warning'> = {
  critico: 'critical',
  alto: 'serious',
  medio: 'warning',
};

export function AnalyticsPage() {
  const [insight, setInsight] = useState<string | null>(null);

  const { data: forecast, isLoading: forecastLoading } = useQuery({
    queryKey: ['ai-sales-forecast'],
    queryFn: async () => (await api.get('/ai/analytics/sales-forecast')).data,
  });

  const { data: stockRisk } = useQuery({
    queryKey: ['ai-stock-risk'],
    queryFn: async () => (await api.get('/ai/analytics/stock-risk')).data,
  });

  const insightMutation = useMutation({
    mutationFn: async () => (await api.get('/ai/analytics/narrative-insight')).data,
    onSuccess: (data) => setInsight(data.insight),
  });

  const chartData = forecast
    ? [
        ...forecast.history.map((h: any) => ({ date: h.date, historico: h.total })),
        ...forecast.projected.map((p: any) => ({ date: p.date, proyectado: p.total })),
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">Analitica predictiva</h1>
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Forecast de ventas, riesgo de inventario e insights generados con IA
          </p>
        </div>
        <Button onClick={() => insightMutation.mutate()} disabled={insightMutation.isPending}>
          {insightMutation.isPending ? 'Analizando...' : 'Generar insight con IA'}
        </Button>
      </div>

      {insight && (
        <Card>
          <CardBody>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Insight de IA</p>
            <p className="mt-1 text-sm whitespace-pre-wrap">{insight}</p>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Forecast de ventas (regresion lineal)</h2>
          {forecast && (
            <Badge tone={forecast.trendDirection === 'creciente' ? 'good' : forecast.trendDirection === 'decreciente' ? 'critical' : 'neutral'}>
              Tendencia {forecast.trendDirection}
            </Badge>
          )}
        </CardHeader>
        <CardBody>
          {forecastLoading ? (
            <p className="text-sm text-ink-muted">Calculando...</p>
          ) : (
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid vertical={false} stroke="#e1e0d9" />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
                  <YAxis
                    tick={{ fontSize: 11, fill: '#898781' }}
                    axisLine={false}
                    tickLine={false}
                    width={60}
                    tickFormatter={(v) => currency.format(v)}
                  />
                  <Tooltip formatter={(value: number) => currency.format(value)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e1e0d9' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Line type="monotone" dataKey="historico" name="Historico" stroke="#2a78d6" strokeWidth={2} dot={{ r: 3 }} connectNulls />
                  <Line type="monotone" dataKey="proyectado" name="Proyectado" stroke="#2a78d6" strokeWidth={2} strokeDasharray="5 4" dot={{ r: 3 }} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Riesgo de stock</h2>
        </CardHeader>
        <CardBody>
          <Table>
            <Thead>
              <tr>
                <Th>Producto</Th>
                <Th>SKU</Th>
                <Th>Stock actual</Th>
                <Th>Umbral</Th>
                <Th>Riesgo</Th>
              </tr>
            </Thead>
            <tbody>
              {stockRisk?.map((p: any) => (
                <Tr key={p.productId}>
                  <Td>{p.name}</Td>
                  <Td>{p.sku}</Td>
                  <Td>{p.stockQuantity}</Td>
                  <Td>{p.reorderThreshold}</Td>
                  <Td>
                    <Badge tone={RISK_TONE[p.riskLevel] ?? 'neutral'}>{p.riskLevel}</Badge>
                  </Td>
                </Tr>
              ))}
              {stockRisk?.length === 0 && (
                <tr>
                  <Td className="text-ink-muted">Sin riesgos de stock detectados.</Td>
                </tr>
              )}
            </tbody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
