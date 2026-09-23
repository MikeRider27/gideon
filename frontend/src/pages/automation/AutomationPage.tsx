import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AutomationLog } from '../../lib/types';
import { Button } from '../../components/ui/Button';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Table, Thead, Th, Tr, Td } from '../../components/ui/Table';
import { useAuth } from '../../context/AuthContext';

const dateFmt = new Intl.DateTimeFormat('es', { dateStyle: 'short', timeStyle: 'short' });

const JOBS = [
  { key: 'low-stock-check', label: 'Revision de stock bajo', description: 'Cada hora' },
  { key: 'invoice-overdue-check', label: 'Facturas vencidas', description: 'Diario 7:00am' },
  { key: 'daily-report', label: 'Reporte diario con IA', description: 'Diario 8:00am' },
];

const STATUS_TONE: Record<string, 'good' | 'critical' | 'neutral'> = {
  SUCCESS: 'good',
  FAILURE: 'critical',
  SKIPPED: 'neutral',
};

export function AutomationPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['automation-logs'],
    queryFn: async () => (await api.get<AutomationLog[]>('/automation/logs')).data,
  });

  const triggerMutation = useMutation({
    mutationFn: (job: string) => api.post(`/automation/trigger/${job}`),
    onSuccess: () => {
      setTimeout(() => queryClient.invalidateQueries({ queryKey: ['automation-logs'] }), 1500);
    },
  });

  const canTrigger = user?.role === 'ADMIN' || user?.role === 'MANAGER';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Automatizacion</h1>
        <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
          Flujos automaticos ejecutados con colas (BullMQ) y programados por cron
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {JOBS.map((job) => (
          <Card key={job.key}>
            <CardBody className="space-y-2">
              <p className="text-sm font-semibold">{job.label}</p>
              <p className="text-xs text-ink-muted">{job.description}</p>
              {canTrigger && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => triggerMutation.mutate(job.key)}
                  disabled={triggerMutation.isPending}
                >
                  Ejecutar ahora
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-sm font-semibold">Historial de ejecuciones</h2>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <p className="text-sm text-ink-muted">Cargando...</p>
          ) : (
            <Table>
              <Thead>
                <tr>
                  <Th>Fecha</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th>Resumen</Th>
                </tr>
              </Thead>
              <tbody>
                {logs?.map((log) => (
                  <Tr key={log.id}>
                    <Td>{dateFmt.format(new Date(log.createdAt))}</Td>
                    <Td>{log.type}</Td>
                    <Td>
                      <Badge tone={STATUS_TONE[log.status]}>{log.status}</Badge>
                    </Td>
                    <Td className="max-w-md truncate">{log.summary}</Td>
                  </Tr>
                ))}
                {logs?.length === 0 && (
                  <tr>
                    <Td className="text-ink-muted">Sin ejecuciones registradas aun.</Td>
                  </tr>
                )}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
