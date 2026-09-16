import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { AiService } from './ai.service';
import { AskAssistantDto, DraftTaskDto } from './dto';

@Controller('projects/:projectId/ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('ask')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  ask(
    @Param('projectId') projectId: string,
    @Body() dto: AskAssistantDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiService.ask(projectId, dto.question, user.id);
  }

  @Post('draft-task')
  @Throttle({ default: { ttl: 60_000, limit: 10 } })
  draftTask(
    @Param('projectId') projectId: string,
    @Body() dto: DraftTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.aiService.draftTask(projectId, dto.description, user.id);
  }
}
