import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { LlmProviderService } from './llm-provider.service';
import { TaskModule } from '../task/task.module';

@Module({
  imports: [TaskModule],
  controllers: [AiController],
  providers: [AiService, LlmProviderService],
})
export class AiModule {}
