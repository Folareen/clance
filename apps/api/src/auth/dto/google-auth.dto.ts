import { IsString } from 'class-validator';

export class GoogleAuthDto {
  @IsString()
  id_token!: string;
}
