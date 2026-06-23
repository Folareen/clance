import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';

export class InviteMemberDto {
  @IsEmail()
  email!: string;

  @IsEnum(['manager', 'worker'])
  role!: 'manager' | 'worker';

  @IsString()
  @IsOptional()
  label?: string;
}
