import { IsUrl } from 'class-validator';

export class UnsubscribeDto {
  @IsUrl({ require_protocol: true })
  endpoint!: string;
}
