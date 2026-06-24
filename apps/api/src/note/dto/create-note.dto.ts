import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateNoteDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsOptional()
  content?: any;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;
}
