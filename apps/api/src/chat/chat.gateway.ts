import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { UsePipes, ValidationPipe } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';
import {
  JoinChannelWsDto,
  LeaveChannelWsDto,
  SendMessageWsDto,
  ToggleReactionWsDto,
  TogglePinWsDto,
  TypingWsDto,
} from './dto';

const wsValidation = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: () => ({ status: 'error', message: 'Invalid payload' }),
});

interface AuthSocket extends Socket {
  userId: string;
  email: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  constructor(
    private jwtService: JwtService,
    private chatService: ChatService,
  ) {}

  async handleConnection(client: AuthSocket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.replace('Bearer ', '');

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      client.userId = payload.sub;
      client.email = payload.email;
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(_client: AuthSocket) {}

  @SubscribeMessage('join_channel')
  @UsePipes(wsValidation)
  async handleJoinChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: JoinChannelWsDto,
  ) {
    try {
      await this.chatService.requireActiveMember(
        data.project_id,
        client.userId,
      );
      const room = `channel:${data.channel_id}`;
      client.join(room);
      return { status: 'ok' };
    } catch {
      return { status: 'error', message: 'Access denied' };
    }
  }

  @SubscribeMessage('leave_channel')
  @UsePipes(wsValidation)
  handleLeaveChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: LeaveChannelWsDto,
  ) {
    client.leave(`channel:${data.channel_id}`);
    return { status: 'ok' };
  }

  @SubscribeMessage('send_message')
  @UsePipes(wsValidation)
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: SendMessageWsDto,
  ) {
    try {
      const message = await this.chatService.sendMessage(
        data.project_id,
        data.channel_id,
        data.content,
        client.userId,
        data.parent_message_id,
      );

      if (data.parent_message_id) {
        this.server
          .to(`channel:${data.channel_id}`)
          .emit('new_reply', { ...message, parent_message_id: data.parent_message_id });
      } else {
        this.server
          .to(`channel:${data.channel_id}`)
          .emit('new_message', message);
      }

      return { status: 'ok', message };
    } catch {
      return { status: 'error', message: 'Failed to send message' };
    }
  }

  @SubscribeMessage('toggle_reaction')
  @UsePipes(wsValidation)
  async handleToggleReaction(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: ToggleReactionWsDto,
  ) {
    try {
      const result = await this.chatService.toggleReaction(
        data.project_id,
        data.channel_id,
        data.message_id,
        data.emoji,
        client.userId,
      );

      this.server.to(`channel:${data.channel_id}`).emit('reaction_updated', {
        message_id: data.message_id,
        emoji: data.emoji,
        user_id: client.userId,
        reacted: result.reacted,
      });

      return { status: 'ok', ...result };
    } catch {
      return { status: 'error', message: 'Failed to react' };
    }
  }

  @SubscribeMessage('toggle_pin')
  @UsePipes(wsValidation)
  async handleTogglePin(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: TogglePinWsDto,
  ) {
    try {
      const result = await this.chatService.togglePin(
        data.project_id,
        data.channel_id,
        data.message_id,
        client.userId,
      );

      this.server.to(`channel:${data.channel_id}`).emit('pin_updated', {
        message_id: data.message_id,
        pinned: result.pinned,
      });

      return { status: 'ok', ...result };
    } catch {
      return { status: 'error', message: 'Failed to pin message' };
    }
  }

  @SubscribeMessage('typing')
  @UsePipes(wsValidation)
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: TypingWsDto,
  ) {
    client.to(`channel:${data.channel_id}`).emit('user_typing', {
      user_id: client.userId,
      channel_id: data.channel_id,
    });
  }

  @SubscribeMessage('stop_typing')
  @UsePipes(wsValidation)
  handleStopTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: TypingWsDto,
  ) {
    client.to(`channel:${data.channel_id}`).emit('user_stop_typing', {
      user_id: client.userId,
      channel_id: data.channel_id,
    });
  }
}
