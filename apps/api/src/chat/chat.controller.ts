import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FastifyRequest } from 'fastify';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  CurrentUser,
  AuthUser,
} from '../common/decorators/current-user.decorator';
import { ChatService } from './chat.service';
import { FileService } from '../upload/file.service';
import { CreateChannelDto, CreateDmDto, ReactDto } from './dto';

@Controller('projects/:projectId/channels')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private chatService: ChatService,
    private fileService: FileService,
  ) {}

  @Get()
  listChannels(
    @Param('projectId') projectId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.listChannels(projectId, user.id);
  }

  @Post()
  createChannel(
    @Param('projectId') projectId: string,
    @Body() dto: CreateChannelDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.createChannel(projectId, dto, user.id);
  }

  @Post('dm')
  createDm(
    @Param('projectId') projectId: string,
    @Body() dto: CreateDmDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.createDm(projectId, dto, user.id);
  }

  @Get(':channelId/messages')
  getMessages(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @Query('cursor') cursor: string | undefined,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getMessages(
      projectId,
      channelId,
      user.id,
      cursor,
    );
  }

  @Get(':channelId/messages/:messageId/thread')
  getThread(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getThread(projectId, channelId, messageId, user.id);
  }

  @Post(':channelId/messages/:messageId/reactions')
  toggleReaction(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @Body() dto: ReactDto,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.toggleReaction(
      projectId,
      channelId,
      messageId,
      dto.emoji,
      user.id,
    );
  }

  @Post(':channelId/messages/:messageId/pin')
  togglePin(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.togglePin(projectId, channelId, messageId, user.id);
  }

  @Get(':channelId/pinned')
  getPinnedMessages(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.chatService.getPinnedMessages(projectId, channelId, user.id);
  }

  @Post(':channelId/files')
  async uploadFile(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @Req() req: FastifyRequest,
    @CurrentUser() user: AuthUser,
  ) {
    const data = await req.file();
    if (!data) throw new BadRequestException('No file uploaded');

    const buffer = await data.toBuffer();

    return this.fileService.upload(
      projectId,
      user.id,
      'message',
      channelId,
      buffer,
      data.filename,
      data.mimetype,
      buffer.length,
    );
  }

  @Get(':channelId/files')
  listChannelFiles(
    @Param('projectId') projectId: string,
    @Param('channelId') channelId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.listByAttachment(projectId, user.id, 'message', channelId);
  }

  @Delete(':channelId/files/:fileId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFile(
    @Param('projectId') projectId: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.fileService.remove(projectId, fileId, user.id);
  }
}
