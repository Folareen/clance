import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql, ilike, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  projects,
  members,
  tasks,
  notes,
  messages,
  channels,
  files,
  users,
} from '../database/schema';

@Injectable()
export class SearchService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async search(user_id: string, query: string) {
    const term = `%${query}%`;

    const userProjects = await this.db
      .select({ project_id: members.project_id, project_name: projects.name })
      .from(members)
      .innerJoin(projects, eq(projects.id, members.project_id))
      .where(and(eq(members.user_id, user_id), eq(members.status, 'active')));

    const projectIds = userProjects.map((p) => p.project_id);

    if (projectIds.length === 0) {
      return { tasks: [], notes: [], messages: [], files: [], members: [] };
    }

    const projectNameMap = new Map(
      userProjects.map((p) => [p.project_id, p.project_name]),
    );

    const [taskResults, noteResults, messageResults, fileResults, memberResults] =
      await Promise.all([
        this.db
          .select({
            id: tasks.id,
            title: tasks.title,
            status: tasks.status,
            priority: tasks.priority,
            task_number: tasks.task_number,
            project_id: tasks.project_id,
            updated_at: tasks.updated_at,
          })
          .from(tasks)
          .where(
            and(
              sql`${tasks.project_id} IN ${projectIds}`,
              ilike(tasks.title, term),
            ),
          )
          .orderBy(desc(tasks.updated_at))
          .limit(10),

        this.db
          .select({
            id: notes.id,
            title: notes.title,
            pinned: notes.pinned,
            project_id: notes.project_id,
            updated_at: notes.updated_at,
          })
          .from(notes)
          .where(
            and(
              sql`${notes.project_id} IN ${projectIds}`,
              ilike(notes.title, term),
            ),
          )
          .orderBy(desc(notes.updated_at))
          .limit(10),

        this.db
          .select({
            id: messages.id,
            content: messages.content,
            channel_id: messages.channel_id,
            sender_first_name: users.first_name,
            sender_last_name: users.last_name,
            sender_email: users.email,
            project_id: channels.project_id,
            channel_name: channels.name,
            channel_type: channels.type,
            created_at: messages.created_at,
            task_id: tasks.id,
            task_number: tasks.task_number,
            task_title: tasks.title,
          })
          .from(messages)
          .innerJoin(channels, eq(channels.id, messages.channel_id))
          .innerJoin(users, eq(users.id, messages.sender_id))
          .leftJoin(
            tasks,
            and(
              eq(channels.type, 'task_comment'),
              sql`${channels.name} = 'task:' || ${tasks.id}`,
            ),
          )
          .where(
            and(
              sql`${channels.project_id} IN ${projectIds}`,
              ilike(messages.content, term),
            ),
          )
          .orderBy(desc(messages.created_at))
          .limit(10),

        this.db
          .select({
            id: files.id,
            filename: files.filename,
            url: files.url,
            mimetype: files.mimetype,
            size: files.size,
            project_id: files.project_id,
            created_at: files.created_at,
          })
          .from(files)
          .where(
            and(
              sql`${files.project_id} IN ${projectIds}`,
              ilike(files.filename, term),
            ),
          )
          .orderBy(desc(files.created_at))
          .limit(10),

        this.db
          .select({
            id: members.id,
            email: members.email,
            role: members.role,
            project_id: members.project_id,
            first_name: users.first_name,
            last_name: users.last_name,
          })
          .from(members)
          .leftJoin(users, eq(users.id, members.user_id))
          .where(
            and(
              sql`${members.project_id} IN ${projectIds}`,
              eq(members.status, 'active'),
              sql`(
                ${members.email} ILIKE ${term}
                OR ${users.first_name} ILIKE ${term}
                OR ${users.last_name} ILIKE ${term}
              )`,
            ),
          )
          .limit(10),
      ]);

    return {
      tasks: taskResults.map((t) => ({
        ...t,
        project_name: projectNameMap.get(t.project_id) ?? '',
      })),
      notes: noteResults.map((n) => ({
        ...n,
        project_name: projectNameMap.get(n.project_id) ?? '',
      })),
      messages: messageResults.map((m) => ({
        ...m,
        project_name: projectNameMap.get(m.project_id) ?? '',
      })),
      files: fileResults.map((f) => ({
        ...f,
        project_name: projectNameMap.get(f.project_id) ?? '',
      })),
      members: memberResults.map((m) => ({
        ...m,
        project_name: projectNameMap.get(m.project_id) ?? '',
      })),
    };
  }
}
