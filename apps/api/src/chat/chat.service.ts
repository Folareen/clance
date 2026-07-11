import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { eq, and, desc, or, asc, sql, inArray } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  channels,
  channel_members,
  messages,
  message_reactions,
  members,
  users,
} from '../database/schema';
import { CreateChannelDto, CreateDmDto } from './dto';
import { NotificationService } from '../notification/notification.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ChatService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private notifications: NotificationService,
    private activity: ActivityService,
  ) {}

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
    parent_message_id?: string,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    if (parent_message_id) {
      const [parent] = await this.db
        .select({ id: messages.id })
        .from(messages)
        .where(
          and(
            eq(messages.id, parent_message_id),
            eq(messages.channel_id, channel_id),
          ),
        )
        .limit(1);
      if (!parent) throw new NotFoundException('Message not found');
    }

    const [message] = await this.db
      .insert(messages)
      .values({ channel_id, sender_id: user_id, content, parent_message_id })
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

    const [ch] = await this.db
      .select({ type: channels.type })
      .from(channels)
      .where(eq(channels.id, channel_id))
      .limit(1);

    const senderName = sender.first_name
      ? `${sender.first_name} ${sender.last_name ?? ''}`.trim()
      : sender.email;

    if (ch?.type === 'dm') {
      const dmMembers = await this.db
        .select({ user_id: channel_members.user_id })
        .from(channel_members)
        .where(eq(channel_members.channel_id, channel_id));

      const recipientIds = dmMembers
        .map((m) => m.user_id)
        .filter((id) => id !== user_id);

      this.notifications.createMany(recipientIds, {
        type: 'dm_received',
        title: `${senderName} sent you a message`,
        body: content.length > 100 ? content.slice(0, 100) + '…' : content,
        project_id,
        link: `/app/projects/${project_id}/chat`,
        actor_id: user_id,
      });
    }

    const mentionedUsernames = this.parseMentions(content);
    if (mentionedUsernames.length > 0) {
      const mentionedUsers = await this.db
        .select({ id: users.id })
        .from(users)
        .innerJoin(members, eq(members.user_id, users.id))
        .where(
          and(
            eq(members.project_id, project_id),
            eq(members.status, 'active'),
            sql`${users.username} IN ${mentionedUsernames}`,
          ),
        );

      const mentionedIds = mentionedUsers
        .map((u) => u.id)
        .filter((id) => id !== user_id);

      if (mentionedIds.length > 0) {
        this.notifications.createMany(mentionedIds, {
          type: 'mentioned',
          title: `${senderName} mentioned you`,
          body: content.length > 100 ? content.slice(0, 100) + '…' : content,
          project_id,
          link: `/app/projects/${project_id}/chat`,
          actor_id: user_id,
        });
      }
    }

    return {
      ...message,
      sender: { id: user_id, ...sender },
      reply_count: 0,
      reactions: [],
    };
  }

  private parseMentions(content: string): string[] {
    const re = /@([a-zA-Z0-9_]{3,40})/g;
    const usernames: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = re.exec(content)) !== null) {
      usernames.push(match[1]);
    }
    return [...new Set(usernames)];
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

    const rows = await this.db
      .select({
        message: messages,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.sender_id))
      .where(
        and(
          eq(messages.channel_id, channel_id),
          sql`${messages.parent_message_id} IS NULL`,
        ),
      )
      .orderBy(desc(messages.created_at))
      .limit(limit + 1);

    const hasMore = rows.length > limit;
    const pageRows = hasMore ? rows.slice(0, limit) : rows;
    const items = await this.enrichMessages(pageRows, user_id);

    return {
      messages: items.reverse(),
      hasMore,
    };
  }

  async getThread(
    project_id: string,
    channel_id: string,
    parent_message_id: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    const [parentRow] = await this.db
      .select({
        message: messages,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.sender_id))
      .where(
        and(eq(messages.id, parent_message_id), eq(messages.channel_id, channel_id)),
      )
      .limit(1);

    if (!parentRow) throw new NotFoundException('Message not found');

    const replyRows = await this.db
      .select({
        message: messages,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.sender_id))
      .where(eq(messages.parent_message_id, parent_message_id))
      .orderBy(asc(messages.created_at));

    const [parent] = await this.enrichMessages([parentRow], user_id);
    const replies = await this.enrichMessages(replyRows, user_id);

    return { parent, replies };
  }

  private async enrichMessages(
    rows: {
      message: typeof messages.$inferSelect;
      first_name: string | null;
      last_name: string | null;
      email: string;
      avatar_url: string | null;
    }[],
    viewer_id: string,
  ) {
    const messageIds = rows.map((r) => r.message.id);

    const replyCounts = messageIds.length
      ? await this.db
          .select({
            parent_message_id: messages.parent_message_id,
            count: sql<number>`count(*)::int`,
          })
          .from(messages)
          .where(inArray(messages.parent_message_id, messageIds))
          .groupBy(messages.parent_message_id)
      : [];

    const reactionRows = messageIds.length
      ? await this.db
          .select({
            message_id: message_reactions.message_id,
            emoji: message_reactions.emoji,
            user_id: message_reactions.user_id,
          })
          .from(message_reactions)
          .where(inArray(message_reactions.message_id, messageIds))
      : [];

    const replyCountMap = new Map(
      replyCounts.map((r) => [r.parent_message_id, r.count]),
    );

    const reactionsByMessage = new Map<string, Map<string, string[]>>();
    for (const r of reactionRows) {
      if (!reactionsByMessage.has(r.message_id)) {
        reactionsByMessage.set(r.message_id, new Map());
      }
      const byEmoji = reactionsByMessage.get(r.message_id)!;
      if (!byEmoji.has(r.emoji)) byEmoji.set(r.emoji, []);
      byEmoji.get(r.emoji)!.push(r.user_id);
    }

    return rows.map((r) => {
      const byEmoji = reactionsByMessage.get(r.message.id);
      const reactions = byEmoji
        ? [...byEmoji.entries()].map(([emoji, userIds]) => ({
            emoji,
            count: userIds.length,
            reacted: userIds.includes(viewer_id),
          }))
        : [];

      return {
        ...r.message,
        sender: {
          id: r.message.sender_id,
          first_name: r.first_name,
          last_name: r.last_name,
          email: r.email,
          avatar_url: r.avatar_url,
        },
        reply_count: replyCountMap.get(r.message.id) ?? 0,
        reactions,
      };
    });
  }

  async toggleReaction(
    project_id: string,
    channel_id: string,
    message_id: string,
    emoji: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    const [message] = await this.db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.id, message_id), eq(messages.channel_id, channel_id)))
      .limit(1);
    if (!message) throw new NotFoundException('Message not found');

    const [existing] = await this.db
      .select()
      .from(message_reactions)
      .where(
        and(
          eq(message_reactions.message_id, message_id),
          eq(message_reactions.user_id, user_id),
          eq(message_reactions.emoji, emoji),
        ),
      )
      .limit(1);

    if (existing) {
      await this.db
        .delete(message_reactions)
        .where(eq(message_reactions.id, existing.id));
      return { reacted: false };
    }

    await this.db.insert(message_reactions).values({ message_id, user_id, emoji });
    return { reacted: true };
  }

  async togglePin(
    project_id: string,
    channel_id: string,
    message_id: string,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    const [message] = await this.db
      .select()
      .from(messages)
      .where(and(eq(messages.id, message_id), eq(messages.channel_id, channel_id)))
      .limit(1);
    if (!message) throw new NotFoundException('Message not found');

    const nextPinned = !message.pinned;

    await this.db
      .update(messages)
      .set({ pinned: nextPinned })
      .where(eq(messages.id, message_id));

    if (nextPinned) {
      const pinnerName = await this.getUserDisplayName(user_id);
      const preview =
        message.content.length > 100
          ? message.content.slice(0, 100) + '…'
          : message.content;

      this.activity.log({
        project_id,
        actor_id: user_id,
        type: 'message_pinned',
        summary: `${pinnerName} pinned a decision`,
        body: preview,
        link: `/app/projects/${project_id}/chat`,
      });

      const channelMembers = channel_id
        ? await this.db
            .select({ user_id: channel_members.user_id })
            .from(channel_members)
            .where(eq(channel_members.channel_id, channel_id))
        : [];

      const [ch] = await this.db
        .select({ type: channels.type, project_id: channels.project_id })
        .from(channels)
        .where(eq(channels.id, channel_id))
        .limit(1);

      const targetIds =
        ch?.type === 'dm'
          ? channelMembers.map((m) => m.user_id)
          : (
              await this.db
                .select({ user_id: members.user_id })
                .from(members)
                .where(
                  and(eq(members.project_id, project_id), eq(members.status, 'active')),
                )
            )
              .map((m) => m.user_id)
              .filter((id): id is string => !!id);

      this.notifications.createMany(targetIds, {
        type: 'message_pinned',
        title: `${pinnerName} pinned a decision`,
        body: preview,
        project_id,
        link: `/app/projects/${project_id}/chat`,
        actor_id: user_id,
      });
    }

    return { pinned: nextPinned };
  }

  async getPinnedMessages(project_id: string, channel_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);
    await this.requireChannelAccess(project_id, channel_id, user_id);

    const rows = await this.db
      .select({
        message: messages,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        avatar_url: users.avatar_url,
      })
      .from(messages)
      .innerJoin(users, eq(users.id, messages.sender_id))
      .where(and(eq(messages.channel_id, channel_id), eq(messages.pinned, true)))
      .orderBy(desc(messages.created_at));

    return this.enrichMessages(rows, user_id);
  }

  private async getUserDisplayName(user_id: string) {
    const [user] = await this.db
      .select({ first_name: users.first_name, last_name: users.last_name, email: users.email })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);
    if (!user) return 'Someone';
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ');
    return name || user.email;
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
