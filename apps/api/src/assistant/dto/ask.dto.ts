import { IsString, IsNotEmpty, MaxLength, IsOptional, IsArray } from 'class-validator';

export class AskDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message!: string;

  @IsOptional()
  @IsArray()
  history?: { role: 'user' | 'assistant'; content: string }[];
}
