import { Module } from '@nestjs/common';
import { CrmModule } from '../crm/crm.module';
import { InventoryModule } from '../inventory/inventory.module';
import { BillingModule } from '../billing/billing.module';
import { DashboardModule } from '../dashboard/dashboard.module';
import { AnthropicProvider } from './anthropic.provider';
import { BusinessToolsService } from './business-tools.service';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { DocumentsService } from './documents.service';
import { DocumentsController } from './documents.controller';

@Module({
  imports: [CrmModule, InventoryModule, BillingModule, DashboardModule],
  providers: [AnthropicProvider, BusinessToolsService, ChatService, AnalyticsService, DocumentsService],
  controllers: [ChatController, AnalyticsController, DocumentsController],
})
export class AiModule {}
