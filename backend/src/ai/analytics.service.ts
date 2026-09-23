import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { DashboardService } from '../dashboard/dashboard.service';
import { ProductsService } from '../inventory/products.service';
import { AnthropicProvider } from './anthropic.provider';

interface ForecastPoint {
  date: string;
  total: number;
  projected?: boolean;
}

@Injectable()
export class AnalyticsService {
  constructor(
    private dashboard: DashboardService,
    private products: ProductsService,
    private anthropicProvider: AnthropicProvider,
  ) {}

  /** Regresion lineal simple (minimos cuadrados) sobre la serie historica de ventas. */
  private linearRegression(points: number[]) {
    const n = points.length;
    if (n < 2) return { slope: 0, intercept: points[0] ?? 0 };

    const xs = points.map((_, i) => i);
    const sumX = xs.reduce((a, b) => a + b, 0);
    const sumY = points.reduce((a, b) => a + b, 0);
    const sumXY = xs.reduce((sum, x, i) => sum + x * points[i], 0);
    const sumXX = xs.reduce((sum, x) => sum + x * x, 0);

    const denominator = n * sumXX - sumX * sumX;
    const slope = denominator === 0 ? 0 : (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return { slope, intercept };
  }

  async salesForecast(historyDays = 30, forecastDays = 7) {
    const trend = await this.dashboard.salesTrend(historyDays);
    const values = trend.map((t) => t.total);
    const { slope, intercept } = this.linearRegression(values);

    const history: ForecastPoint[] = trend;
    const projected: ForecastPoint[] = [];
    const lastDate = trend.length ? new Date(trend[trend.length - 1].date) : new Date();

    for (let i = 1; i <= forecastDays; i++) {
      const date = new Date(lastDate);
      date.setDate(date.getDate() + i);
      const value = Math.max(0, intercept + slope * (values.length - 1 + i));
      projected.push({ date: date.toISOString().slice(0, 10), total: Math.round(value * 100) / 100, projected: true });
    }

    const trendDirection = slope > 0.5 ? 'creciente' : slope < -0.5 ? 'decreciente' : 'estable';

    return { history, projected, trendDirection, dailyGrowthRate: Math.round(slope * 100) / 100 };
  }

  async stockRiskAssessment() {
    const lowStock = await this.products.lowStock();
    return lowStock
      .map((p) => ({
        productId: p.id,
        name: p.name,
        sku: p.sku,
        stockQuantity: p.stockQuantity,
        reorderThreshold: p.reorderThreshold,
        riskLevel: p.stockQuantity === 0 ? 'critico' : p.stockQuantity < p.reorderThreshold / 2 ? 'alto' : 'medio',
      }))
      .sort((a, b) => a.stockQuantity - b.stockQuantity);
  }

  async narrativeInsight(context: Record<string, unknown>): Promise<string> {
    try {
      const client = this.anthropicProvider.getClient();
      const response = await client.messages.create({
        model: this.anthropicProvider.model,
        max_tokens: 400,
        system:
          'Eres un analista de negocio. A partir de datos JSON de ventas e inventario, escribe un resumen breve (3-5 frases) en espanol, en tono ejecutivo, destacando riesgos y oportunidades. No inventes cifras que no esten en los datos.',
        messages: [{ role: 'user', content: JSON.stringify(context) }],
      });
      return response.content
        .filter((b): b is Anthropic.TextBlock => b.type === 'text')
        .map((b) => b.text)
        .join('\n');
    } catch (error) {
      return 'No se pudo generar el analisis narrativo con IA (verifica la configuracion de ANTHROPIC_API_KEY).';
    }
  }
}
