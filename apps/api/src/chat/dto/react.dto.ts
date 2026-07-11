import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ReactDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  emoji!: string;
}
