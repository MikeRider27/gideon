import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@UseGuards(JwtAuthGuard)
@Controller('ai/analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('sales-forecast')
  async salesForecast(@Query('historyDays') historyDays?: string, @Query('forecastDays') forecastDays?: string) {
    return this.analyticsService.salesForecast(
      historyDays ? parseInt(historyDays, 10) : undefined,
      forecastDays ? parseInt(forecastDays, 10) : undefined,
    );
  }

  @Get('stock-risk')
  stockRisk() {
    return this.analyticsService.stockRiskAssessment();
  }

  @Get('narrative-insight')
  async narrativeInsight() {
    const forecast = await this.analyticsService.salesForecast();
    const stockRisk = await this.analyticsService.stockRiskAssessment();
    const insight = await this.analyticsService.narrativeInsight({ forecast, stockRisk });
    return { insight };
  }
}
