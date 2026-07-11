import { Body, Controller, Delete, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { PushService } from './push.service';
import { SubscribeDto, UnsubscribeDto } from './dto';

@Controller('push')
@UseGuards(JwtAuthGuard)
export class PushController {
  constructor(private pushService: PushService) {}

  @Post('subscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  subscribe(@Body() dto: SubscribeDto, @CurrentUser() user: AuthUser) {
    return this.pushService.subscribe(user.id, dto);
  }

  @Delete('unsubscribe')
  @HttpCode(HttpStatus.NO_CONTENT)
  unsubscribe(@Body() dto: UnsubscribeDto) {
    return this.pushService.unsubscribe(dto.endpoint);
  }
}
