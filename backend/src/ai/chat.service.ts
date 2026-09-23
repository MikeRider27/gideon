import { Injectable, NotFoundException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { PrismaService } from '../prisma/prisma.service';
import { AnthropicProvider } from './anthropic.provider';
import { BUSINESS_TOOLS, BusinessToolsService } from './business-tools.service';

const SYSTEM_PROMPT = `Eres el asistente de IA de Gideon, un sistema de gestion empresarial (ERP) que cubre CRM, inventario, compras, ventas y facturacion.
Ayudas a los usuarios del negocio a entender sus datos e identificar acciones. Usa las herramientas disponibles para consultar datos reales del sistema antes de responder preguntas sobre clientes, productos, ventas, facturas o el pipeline comercial.
Responde siempre en espanol, de forma clara, concisa y orientada a la accion. Si detectas riesgos (stock bajo, facturas vencidas, oportunidades estancadas), mencionalos proactivamente.`;

const MAX_TOOL_ITERATIONS = 5;

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
    private anthropicProvider: AnthropicProvider,
    private tools: BusinessToolsService,
  ) {}

  listSessions(userId: string) {
    return this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getSession(userId: string, sessionId: string) {
    const session = await this.prisma.chatSession.findFirst({
      where: { id: sessionId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!session) throw new NotFoundException('Conversacion no encontrada');
    return session;
  }

  async sendMessage(userId: string, sessionId: string | undefined, content: string) {
    let session = sessionId
      ? await this.prisma.chatSession.findFirst({ where: { id: sessionId, userId } })
      : null;

    if (!session) {
      session = await this.prisma.chatSession.create({
        data: { userId, title: content.slice(0, 60) },
      });
    }

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'user', content },
    });

    const history = await this.prisma.chatMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'asc' },
    });

    const client = this.anthropicProvider.getClient();
    const messages: Anthropic.MessageParam[] = history.map((m) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content,
    }));

    let finalText = '';
    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await client.messages.create({
        model: this.anthropicProvider.model,
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: BUSINESS_TOOLS,
        messages,
      });

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
      );

      if (toolUseBlocks.length === 0 || response.stop_reason !== 'tool_use') {
        finalText = response.content
          .filter((b): b is Anthropic.TextBlock => b.type === 'text')
          .map((b) => b.text)
          .join('\n');
        break;
      }

      messages.push({ role: 'assistant', content: response.content });

      const toolResults: Anthropic.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        const result = await this.tools.execute(block.name, block.input as Record<string, any>);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result, null, 2).slice(0, 8000),
        });
      }
      messages.push({ role: 'user', content: toolResults });
    }

    if (!finalText) {
      finalText = 'No pude generar una respuesta completa. Intenta reformular tu pregunta.';
    }

    await this.prisma.chatMessage.create({
      data: { sessionId: session.id, role: 'assistant', content: finalText },
    });
    await this.prisma.chatSession.update({
      where: { id: session.id },
      data: { updatedAt: new Date() },
    });

    return { sessionId: session.id, reply: finalText };
  }
}
