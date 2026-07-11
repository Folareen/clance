import { Module } from '@nestjs/common';
import { NoteController } from './note.controller';
import { NoteService } from './note.service';
import { ActivityModule } from '../activity/activity.module';

@Module({
  imports: [ActivityModule],
  controllers: [NoteController],
  providers: [NoteService],
  exports: [NoteService],
})
export class NoteModule {}
