import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/chat.dto';

@UseGuards(JwtAuthGuard)
@Controller('ai/chat')
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Get('sessions')
  listSessions(@CurrentUser() user: { userId: string }) {
    return this.chatService.listSessions(user.userId);
  }

  @Get('sessions/:id')
  getSession(@CurrentUser() user: { userId: string }, @Param('id') id: string) {
    return this.chatService.getSession(user.userId, id);
  }

  @Post('messages')
  sendMessage(@CurrentUser() user: { userId: string }, @Body() dto: SendMessageDto) {
    return this.chatService.sendMessage(user.userId, dto.sessionId, dto.content);
  }
}
