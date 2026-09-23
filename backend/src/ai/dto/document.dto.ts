import { IsString, MinLength } from 'class-validator';

export class ExtractDocumentDto {
  @IsString()
  @MinLength(10)
  text: string;
}
