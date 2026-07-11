import { IsString, IsOptional, IsUrl, IsISO8601, IsUUID, MaxLength } from 'class-validator';

export class UpdateMeetingDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  title?: string;

  @IsUUID()
  @IsOptional()
  task_id?: string | null;

  @IsUrl({ require_protocol: true })
  @IsOptional()
  @MaxLength(500)
  join_url?: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  notes?: string;

  @IsISO8601()
  @IsOptional()
  happened_at?: string;
}
