import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOpportunityDto, UpdateOpportunityDto } from './dto/opportunity.dto';

@Injectable()
export class OpportunitiesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateOpportunityDto) {
    const { customerId, ...rest } = dto;
    return this.prisma.opportunity.create({
      data: { ...rest, customer: { connect: { id: customerId } } },
    });
  }

  findAll(stage?: string) {
    return this.prisma.opportunity.findMany({
      where: stage ? { stage: stage as any } : undefined,
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const opportunity = await this.prisma.opportunity.findUnique({
      where: { id },
      include: { customer: true },
    });
    if (!opportunity) throw new NotFoundException('Oportunidad no encontrada');
    return opportunity;
  }

  async update(id: string, dto: UpdateOpportunityDto) {
    await this.findOne(id);
    return this.prisma.opportunity.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.opportunity.delete({ where: { id } });
    return { success: true };
  }

  async pipelineSummary() {
    const opportunities = await this.prisma.opportunity.findMany();
    const summary: Record<string, { count: number; value: number }> = {};
    for (const opp of opportunities) {
      const stage = opp.stage;
      if (!summary[stage]) summary[stage] = { count: 0, value: 0 };
      summary[stage].count += 1;
      summary[stage].value += Number(opp.value);
    }
    return summary;
  }
}
