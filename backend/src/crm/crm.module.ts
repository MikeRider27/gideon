import { Module } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CustomersController } from './customers.controller';
import { OpportunitiesService } from './opportunities.service';
import { OpportunitiesController } from './opportunities.controller';

@Module({
  providers: [CustomersService, OpportunitiesService],
  controllers: [CustomersController, OpportunitiesController],
  exports: [CustomersService, OpportunitiesService],
})
export class CrmModule {}
