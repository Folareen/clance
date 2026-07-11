import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ChatService } from './chat.service';

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
  async handleJoinChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { project_id: string; channel_id: string },
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
  handleLeaveChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channel_id: string },
  ) {
    client.leave(`channel:${data.channel_id}`);
    return { status: 'ok' };
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: {
      project_id: string;
      channel_id: string;
      content: string;
      parent_message_id?: string;
    },
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
  async handleToggleReaction(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody()
    data: {
      project_id: string;
      channel_id: string;
      message_id: string;
      emoji: string;
    },
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

  @SubscribeMessage('typing')
  handleTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channel_id: string },
  ) {
    client.to(`channel:${data.channel_id}`).emit('user_typing', {
      user_id: client.userId,
      channel_id: data.channel_id,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channel_id: string },
  ) {
    client.to(`channel:${data.channel_id}`).emit('user_stop_typing', {
      user_id: client.userId,
      channel_id: data.channel_id,
    });
  }
}
