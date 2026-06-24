import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, desc, or, asc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  channels,
  channel_members,
  messages,
  members,
  users,
} from '../database/schema';
import { CreateChannelDto, CreateDmDto } from './dto';

@Injectable()
export class ChatService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async getOrCreateGeneralChannel(project_id: string, user_id: string) {
    const [existing] = await this.db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'group'),
          eq(channels.name, 'general'),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [channel] = await this.db
      .insert(channels)
      .values({
        project_id,
        name: 'general',
        type: 'group',
        created_by: user_id,
      })
      .returning();

    return channel;
  }

  async listChannels(project_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);
    await this.getOrCreateGeneralChannel(project_id, user_id);

    const groupChannels = await this.db
      .select()
      .from(channels)
      .where(
        and(eq(channels.project_id, project_id), eq(channels.type, 'group')),
      )
      .orderBy(asc(channels.created_at));

    const dmRows = await this.db
      .select({
        channel: channels,
        peer_id: channel_members.user_id,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(channels)
      .innerJoin(channel_members, eq(channel_members.channel_id, channels.id))
      .innerJoin(users, eq(users.id, channel_members.user_id))
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'dm'),
        ),
      )
      .orderBy(asc(channels.created_at));

    const myDmChannelIds = new Set(
      dmRows
        .filter((r) => r.peer_id === user_id)
        .map((r) => r.channel.id),
    );

    const dmChannels = dmRows
      .filter(
        (r) => myDmChannelIds.has(r.channel.id) && r.peer_id !== user_id,
      )
      .map((r) => ({
        ...r.channel,
        peer: {
          id: r.peer_id,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
        },
      }));

    return { group: groupChannels, dm: dmChannels };
  }

  async createChannel(
    project_id: string,
    dto: CreateChannelDto,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const [channel] = await this.db
      .insert(channels)
      .values({
        project_id,
        name: dto.name.toLowerCase().replace(/\s+/g, '-'),
        type: 'group',
        created_by: user_id,
      })
      .returning();

    return channel;
  }

  async createDm(project_id: string, dto: CreateDmDto, user_id: string) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireActiveMember(project_id, dto.member_user_id);

    if (dto.member_user_id === user_id) {
      throw new ConflictException('Cannot create a DM with yourself');
    }

    const existingDms = await this.db
      .select({ channel_id: channel_members.channel_id })
      .from(channel_members)
      .innerJoin(channels, eq(channels.id, channel_members.channel_id))
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'dm'),
          eq(channel_members.user_id, user_id),
        ),
      );

    for (const dm of existingDms) {
      const [peer] = await this.db
        .select()
        .from(channel_members)
        .where(
          and(
            eq(channel_members.channel_id, dm.channel_id),
            eq(channel_members.user_id, dto.member_user_id),
          ),
        )
        .limit(1);

      if (peer) {
        const [ch] = await this.db
          .select()
          .from(channels)
          .where(eq(channels.id, dm.channel_id))
          .limit(1);
        return ch;
      }
    }

    const [channel] = await this.db
      .insert(channels)
      .values({
        project_id,
        name: null,
        type: 'dm',
        created_by: user_id,
      })
      .returning();

    await this.db.insert(channel_members).values([
      { channel_id: channel.id, user_id },
      { channel_id: channel.id, user_id: dto.member_user_id },
    ]);

    return channel;
  }

  async sendMessage(
    project_id: string,
    channel_id: string,
    content: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    const [message] = await this.db
      .insert(messages)
      .values({ channel_id, sender_id: user_id, content })
      .returning();

    const [sender] = await this.db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    return {
      ...message,
      sender: { id: user_id, ...sender },
    };
  }

  async getMessages(
    project_id: string,
    channel_id: string,
    user_id: string,
    cursor?: string,
    limit = 50,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    let query = this.db
      .select({
        message: messages,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.sender_id))
      .where(eq(messages.channel_id, channel_id))
      .orderBy(desc(messages.created_at))
      .limit(limit + 1);

    const rows = await query;

    const hasMore = rows.length > limit;
    const items = (hasMore ? rows.slice(0, limit) : rows).map((r) => ({
      ...r.message,
      sender: {
        id: r.message.sender_id,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
        avatar_url: r.avatar_url,
      },
    }));

    return {
      messages: items.reverse(),
      hasMore,
    };
  }

  private async requireChannelAccess(
    project_id: string,
    channel_id: string,
    user_id: string,
  ) {
    const [channel] = await this.db
      .select()
      .from(channels)
      .where(
        and(eq(channels.id, channel_id), eq(channels.project_id, project_id)),
      )
      .limit(1);

    if (!channel) throw new NotFoundException('Channel not found');

    if (channel.type === 'dm') {
      const [membership] = await this.db
        .select()
        .from(channel_members)
        .where(
          and(
            eq(channel_members.channel_id, channel_id),
            eq(channel_members.user_id, user_id),
          ),
        )
        .limit(1);

      if (!membership)
        throw new ForbiddenException('Not a member of this DM');
    }

    return channel;
  }

  async getOrCreateTaskCommentChannel(
    project_id: string,
    task_id: string,
    user_id: string,
  ) {
    const channelName = `task:${task_id}`;

    const [existing] = await this.db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'task_comment'),
          eq(channels.name, channelName),
        ),
      )
      .limit(1);

    if (existing) return existing;

    const [channel] = await this.db
      .insert(channels)
      .values({
        project_id,
        name: channelName,
        type: 'task_comment',
        created_by: user_id,
      })
      .returning();

    return channel;
  }

  async sendComment(
    project_id: string,
    task_id: string,
    content: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const channel = await this.getOrCreateTaskCommentChannel(
      project_id,
      task_id,
      user_id,
    );

    return this.sendMessage(project_id, channel.id, content, user_id);
  }

  async getComments(
    project_id: string,
    task_id: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const channelName = `task:${task_id}`;
    const [channel] = await this.db
      .select()
      .from(channels)
      .where(
        and(
          eq(channels.project_id, project_id),
          eq(channels.type, 'task_comment'),
          eq(channels.name, channelName),
        ),
      )
      .limit(1);

    if (!channel) return { messages: [], hasMore: false, channelId: null };

    const result = await this.getMessages(
      project_id,
      channel.id,
      user_id,
    );

    return { ...result, channelId: channel.id };
  }

  async requireActiveMember(project_id: string, user_id: string) {
    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.project_id, project_id),
          eq(members.user_id, user_id),
          eq(members.status, 'active'),
        ),
      )
      .limit(1);

    if (!member) throw new ForbiddenException('Not a member of this project');
    return member;
  }
}
