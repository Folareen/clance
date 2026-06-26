import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { NotificationService } from './notification.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private notificationService: NotificationService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.notificationService.list(user.id);
  }

  @Get('unread-count')
  async unreadCount(@CurrentUser() user: AuthUser) {
    const count = await this.notificationService.unreadCount(user.id);
    return { count };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  markRead(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.notificationService.markRead(user.id, id);
  }

  @Post('read-all')
  @HttpCode(HttpStatus.NO_CONTENT)
  markAllRead(@CurrentUser() user: AuthUser) {
    return this.notificationService.markAllRead(user.id);
  }
}
