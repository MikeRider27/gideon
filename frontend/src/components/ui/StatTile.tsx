import { Card, CardBody } from './Card';

interface StatTileProps {
  label: string;
  value: string;
  hint?: string;
  tone?: 'neutral' | 'warning' | 'critical';
}

const toneText: Record<string, string> = {
  neutral: 'text-ink-primary dark:text-ink-primary-dark',
  warning: 'text-status-serious',
  critical: 'text-status-critical',
};

export function StatTile({ label, value, hint, tone = 'neutral' }: StatTileProps) {
  return (
    <Card>
      <CardBody>
        <p className="text-xs font-medium uppercase tracking-wide text-ink-muted">{label}</p>
        <p className={`mt-1 text-2xl font-semibold ${toneText[tone]}`}>{value}</p>
        {hint && <p className="mt-1 text-xs text-ink-secondary dark:text-ink-secondary-dark">{hint}</p>}
      </CardBody>
    </Card>
  );
}
