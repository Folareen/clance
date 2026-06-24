import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  MaxLength,
} from 'class-validator';

export class UpdateTaskDto {
  @IsString()
  @MaxLength(500)
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['backlog', 'in_progress', 'submitted', 'approved'])
  @IsOptional()
  status?: string;

  @IsEnum(['urgent', 'high', 'medium', 'low', 'none'])
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  due_date?: string | null;

  @IsUUID()
  @IsOptional()
  parent_id?: string | null;
}
