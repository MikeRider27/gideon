import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { AnthropicProvider } from './anthropic.provider';

const EXTRACTION_SYSTEM_PROMPT = `Extraes datos estructurados de documentos de negocio (facturas, recibos, ordenes de compra) en espanol o ingles.
Devuelve UNICAMENTE un objeto JSON valido (sin markdown, sin explicaciones) con esta forma:
{
  "documentType": "invoice" | "receipt" | "purchase_order" | "unknown",
  "vendorName": string | null,
  "customerName": string | null,
  "documentNumber": string | null,
  "issueDate": string | null,
  "dueDate": string | null,
  "currency": string | null,
  "lineItems": [{ "description": string, "quantity": number | null, "unitPrice": number | null, "total": number | null }],
  "subtotal": number | null,
  "tax": number | null,
  "total": number | null,
  "confidence": "high" | "medium" | "low"
}
Si un campo no aparece en el texto, usa null. No inventes valores.`;

@Injectable()
export class DocumentsService {
  constructor(private anthropicProvider: AnthropicProvider) {}

  async extract(rawText: string) {
    const client = this.anthropicProvider.getClient();
    const response = await client.messages.create({
      model: this.anthropicProvider.model,
      max_tokens: 1500,
      system: EXTRACTION_SYSTEM_PROMPT,
      messages: [{ role: 'user', content: rawText.slice(0, 20000) }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      const jsonSlice = text.slice(jsonStart, jsonEnd + 1);
      return JSON.parse(jsonSlice);
    } catch {
      return { documentType: 'unknown', raw: text, confidence: 'low' };
    }
  }

  async summarize(rawText: string) {
    const client = this.anthropicProvider.getClient();
    const response = await client.messages.create({
      model: this.anthropicProvider.model,
      max_tokens: 500,
      system: 'Resume el siguiente documento de negocio en espanol, en un maximo de 5 puntos clave (bullet points).',
      messages: [{ role: 'user', content: rawText.slice(0, 20000) }],
    });

    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');
  }
}
