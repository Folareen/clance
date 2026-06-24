import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class UpdateNoteDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsOptional()
  content?: any;

  @IsBoolean()
  @IsOptional()
  pinned?: boolean;
}
