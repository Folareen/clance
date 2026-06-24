import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  name!: string;
}

export class CreateDmDto {
  @IsUUID()
  @IsNotEmpty()
  member_user_id!: string;
}
