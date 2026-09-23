import { BadRequestException, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { AutomationType } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AutomationService } from './automation.service';

const JOB_NAMES = ['low-stock-check', 'invoice-overdue-check', 'daily-report'] as const;

@UseGuards(JwtAuthGuard)
@Controller('automation')
export class AutomationController {
  constructor(
    private automationService: AutomationService,
    @InjectQueue('automation') private automationQueue: Queue,
  ) {}

  @Get('logs')
  listLogs(@Query('type') type?: AutomationType) {
    return this.automationService.listLogs(type);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'MANAGER')
  @Post('trigger/:job')
  async trigger(@Param('job') job: string) {
    if (!JOB_NAMES.includes(job as (typeof JOB_NAMES)[number])) {
      throw new BadRequestException(`Job invalido. Usa uno de: ${JOB_NAMES.join(', ')}`);
    }
    await this.automationQueue.add(job, {});
    return { queued: true, job };
  }
}
