import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  content!: string;

  @IsUUID()
  @IsOptional()
  parent_message_id?: string;
}
