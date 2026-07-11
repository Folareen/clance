import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ActivityService } from './activity.service';

@Controller('projects/:projectId/activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private activityService: ActivityService) {}

  @Get()
  list(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.activityService.list(
      projectId,
      user.id,
      limit ? parseInt(limit, 10) : undefined,
      offset ? parseInt(offset, 10) : undefined,
    );
  }
}
