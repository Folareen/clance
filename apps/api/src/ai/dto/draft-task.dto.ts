import { IsString, MaxLength, MinLength } from 'class-validator';

export class DraftTaskDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  description!: string;
}
