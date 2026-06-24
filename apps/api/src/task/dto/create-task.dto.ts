import {
  IsString,
  IsOptional,
  IsUUID,
  IsEnum,
  IsDateString,
  IsArray,
  MaxLength,
} from 'class-validator';

export class CreateTaskDto {
  @IsString()
  @MaxLength(500)
  title!: string;

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
  due_date?: string;

  @IsUUID()
  @IsOptional()
  parent_id?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @IsOptional()
  assignee_ids?: string[];
}
