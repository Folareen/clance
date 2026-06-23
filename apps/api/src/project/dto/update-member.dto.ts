import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateMemberDto {
  @IsEnum(['manager', 'worker'])
  @IsOptional()
  role?: 'manager' | 'worker';

  @IsString()
  @IsOptional()
  label?: string;
}
