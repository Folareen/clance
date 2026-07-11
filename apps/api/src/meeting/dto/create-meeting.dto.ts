import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateMeetingDto {
  @IsString()
  @MaxLength(255)
  title!: string;

  @IsUUID()
  @IsOptional()
  task_id?: string;
}
