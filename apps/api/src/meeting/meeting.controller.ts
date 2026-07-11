import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { MeetingService } from './meeting.service';
import { CreateMeetingDto } from './dto';

@Controller('projects/:projectId/meetings')
@UseGuards(JwtAuthGuard)
export class MeetingController {
  constructor(private meetingService: MeetingService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateMeetingDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.meetingService.create(projectId, dto, user.id);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @CurrentUser() user: AuthUser) {
    return this.meetingService.findAll(projectId, user.id);
  }
}
