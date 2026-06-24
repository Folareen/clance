import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;

  @IsString()
  @IsNotEmpty()
  content!: string;
}
