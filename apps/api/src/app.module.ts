import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database';
import { AuthModule } from './auth/auth.module';
import { ProjectModule } from './project/project.module';
import { TaskModule } from './task/task.module';
import { NoteModule } from './note/note.module';
import { ChatModule } from './chat/chat.module';
import { UploadModule } from './upload/upload.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { AssistantModule } from './assistant/assistant.module';
import { SearchModule } from './search/search.module';
import { NotificationModule } from './notification/notification.module';
import { ActivityModule } from './activity/activity.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    ProjectModule,
    TaskModule,
    NoteModule,
    ChatModule,
    UploadModule,
    DashboardModule,
    AssistantModule,
    SearchModule,
    NotificationModule,
    ActivityModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
