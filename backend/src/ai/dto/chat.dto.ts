import { IsOptional, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsOptional()
  @IsUUID()
  sessionId?: string;

  @IsString()
  content: string;
}
