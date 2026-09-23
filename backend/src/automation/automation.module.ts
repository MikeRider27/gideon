import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { InventoryModule } from '../inventory/inventory.module';
import { BillingModule } from '../billing/billing.module';
import { AiModule } from '../ai/ai.module';
import { AutomationService } from './automation.service';
import { AutomationProcessor } from './automation.processor';
import { AutomationScheduler } from './automation.scheduler';
import { AutomationController } from './automation.controller';

@Module({
  imports: [
    BullModule.registerQueue({ name: 'automation' }),
    InventoryModule,
    BillingModule,
    AiModule,
  ],
  providers: [AutomationService, AutomationProcessor, AutomationScheduler],
  controllers: [AutomationController],
})
export class AutomationModule {}
