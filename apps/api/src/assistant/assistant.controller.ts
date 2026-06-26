import {
  Body,
  Controller,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { AssistantService } from './assistant.service';
import { AskDto } from './dto';

@Controller('projects/:projectId/assistant')
@UseGuards(JwtAuthGuard)
export class AssistantController {
  constructor(private assistantService: AssistantService) {}

  @Post('ask')
  ask(
    @Param('projectId') projectId: string,
    @Body() dto: AskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.assistantService.ask(projectId, dto, user.id);
  }
}
