import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';

@Injectable()
export class AnthropicProvider {
  private readonly logger = new Logger(AnthropicProvider.name);
  private client: Anthropic | null = null;

  getClient(): Anthropic {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new ServiceUnavailableException(
        'ANTHROPIC_API_KEY no esta configurada. Define esta variable en el .env para habilitar las funciones de IA.',
      );
    }
    if (!this.client) {
      this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      this.logger.log('Cliente de Anthropic inicializado');
    }
    return this.client;
  }

  get model(): string {
    return process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5';
  }
}
