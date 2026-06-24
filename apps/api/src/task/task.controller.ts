import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { TaskService } from './task.service';
import { FileService } from '../upload/file.service';
import { ChatService } from '../chat/chat.service';
import { CreateTaskDto, UpdateTaskDto, AssignTaskDto } from './dto';

@Controller('projects/:projectId/tasks')
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private taskService: TaskService,
    private fileService: FileService,
    private chatService: ChatService,
  ) {}

  @Post()
  create(
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.create(projectId, dto, user.id);
  }

  @Get()
  findAll(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
  ) {
    return this.taskService.findAll(projectId, user.id, {
      status,
      priority,
      search,
    });
  }

  @Get(':taskId')
  findOne(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.findOne(projectId, taskId, user.id);
  }

  @Patch(':taskId')
  update(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.update(projectId, taskId, dto, user.id);
  }

  @Delete(':taskId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.remove(projectId, taskId, user.id);
  }

  @Post(':taskId/assign')
  assign(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body() dto: AssignTaskDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.taskService.assign(projectId, taskId, dto, user.id);
  }

  @Post(':taskId/files')
  async uploadFile(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await req.file();
    if (!data) throw new BadRequestException('No file uploaded');

    const buffer = await data.toBuffer();

    return this.fileService.upload(
      projectId,
      user.id,
      'task',
      taskId,
      buffer,
      data.filename,
      data.mimetype,
      buffer.length,
    );
  }

  @Get(':taskId/files')
  listFiles(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.listByAttachment(projectId, user.id, 'task', taskId);
  }

  @Delete(':taskId/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.remove(projectId, fileId, user.id);
  }

  @Get(':taskId/comments')
  getComments(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getComments(projectId, taskId, user.id);
  }

  @Post(':taskId/comments')
  sendComment(
    @Param('projectId') projectId: string,
    @Param('taskId') taskId: string,
    @Body('content') content: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.sendComment(projectId, taskId, content, user.id);
  }
}
