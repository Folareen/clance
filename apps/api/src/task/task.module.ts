import { Module } from '@nestjs/common';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { ChatModule } from '../chat/chat.module';
import { NotificationModule } from '../notification/notification.module';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ChatModule, NotificationModule, ActivityModule],
  controllers: [TaskController],
  providers: [TaskService],
  exports: [TaskService],
})
export class TaskModule {}
