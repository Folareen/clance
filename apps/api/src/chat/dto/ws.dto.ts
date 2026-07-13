import { IsNotEmpty, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class JoinChannelWsDto {
  @IsUUID()
  @IsNotEmpty()
  project_id!: string;

  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;
}

export class LeaveChannelWsDto {
  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;
}

export class SendMessageWsDto {
  @IsUUID()
  @IsNotEmpty()
  project_id!: string;

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

export class ToggleReactionWsDto {
  @IsUUID()
  @IsNotEmpty()
  project_id!: string;

  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;

  @IsUUID()
  @IsNotEmpty()
  message_id!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  emoji!: string;
}

export class TogglePinWsDto {
  @IsUUID()
  @IsNotEmpty()
  project_id!: string;

  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;

  @IsUUID()
  @IsNotEmpty()
  message_id!: string;
}

export class TypingWsDto {
  @IsUUID()
  @IsNotEmpty()
  channel_id!: string;
}
