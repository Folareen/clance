import { IsString, IsOptional, IsEmail, MinLength, ValidateIf } from 'class-validator';

export class AcceptInviteDto {
  @IsString()
  token!: string;
}

export class AcceptInviteWithSignupDto {
  @IsString()
  token!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  first_name?: string;

  @IsString()
  @IsOptional()
  last_name?: string;
}
