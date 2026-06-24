import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { NoteService } from './note.service';
import { CreateNoteDto, UpdateNoteDto } from './dto';

@Controller('projects/:projectId/notes')
@UseGuards(JwtAuthGuard)
export class NoteController {
  constructor(private noteService: NoteService) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.noteService.create(projectId, dto, user.id);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.noteService.findAll(projectId, user.id);
  }

  @Get(':noteId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.noteService.findOne(projectId, noteId, user.id);
  }

  @Patch(':noteId')
  update(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @Body() dto: UpdateNoteDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.noteService.update(projectId, noteId, dto, user.id);
  }

  @Delete(':noteId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('projectId') projectId: string,
    @Param('noteId') noteId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.noteService.remove(projectId, noteId, user.id);
  }
}
