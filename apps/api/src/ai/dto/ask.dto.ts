import { IsString, MaxLength, MinLength } from 'class-validator';

export class AskAssistantDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  question!: string;
}
