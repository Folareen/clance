import { IsBoolean, IsOptional } from 'class-validator';

export class UpdatePreferencesDto {
  @IsBoolean()
  @IsOptional()
  email?: boolean;

  @IsBoolean()
  @IsOptional()
  mentions?: boolean;

  @IsBoolean()
  @IsOptional()
  task_updates?: boolean;

  @IsBoolean()
  @IsOptional()
  approvals?: boolean;
}
