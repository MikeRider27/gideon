import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { DocumentsService } from './documents.service';
import { ExtractDocumentDto } from './dto/document.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai/documents')
export class DocumentsController {
  constructor(private documentsService: DocumentsService) {}

  @Post('extract')
  extract(@Body() dto: ExtractDocumentDto) {
    return this.documentsService.extract(dto.text);
  }

  @Post('summarize')
  async summarize(@Body() dto: ExtractDocumentDto) {
    const summary = await this.documentsService.summarize(dto.text);
    return { summary };
  }
}
