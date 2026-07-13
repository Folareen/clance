import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, inArray, desc, or } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  files,
  members,
  users,
  projects,
  tasks,
  channels,
  channel_members,
} from '../database/schema';
import { CloudinaryService } from './cloudinary.service';
import { ActivityService } from '../activity/activity.service';

// Allowlist covers common office/doc/image/archive/media types shared in a
// project workspace. Executables, HTML, and inline-scriptable SVGs are
// deliberately excluded to avoid stored-XSS/malware distribution through
// Cloudinary-hosted links shared with other project members.
const ALLOWED_MIME_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'application/pdf',
  'text/plain',
  'text/csv',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/zip',
  'application/json',
]);

@Injectable()
export class FileService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private cloudinary: CloudinaryService,
    private activity: ActivityService,
  ) {}

  async upload(
    project_id: string,
    user_id: string,
    attach_type: 'task' | 'message',
    attach_id: string,
    fileBuffer: Buffer,
    filename: string,
    mimetype?: string,
    size?: number,
  ) {
    await this.requireActiveMember(project_id, user_id);

    if (!mimetype || !ALLOWED_MIME_TYPES.has(mimetype)) {
      throw new BadRequestException(
        `File type "${mimetype ?? 'unknown'}" is not allowed`,
      );
    }

    const result = await this.cloudinary.upload(fileBuffer, {
      folder: `clance/${project_id}/${attach_type}s`,
    });

    const [file] = await this.db
      .insert(files)
      .values({
        project_id,
        uploaded_by: user_id,
        cloudinary_id: result.public_id,
        url: result.secure_url,
        filename,
        mimetype,
        size,
        attach_type,
        attach_id,
      })
      .returning();

    const [uploader] = await this.db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'file_uploaded',
      summary: `uploaded "${filename}"`,
      link:
        attach_type === 'task'
          ? `/app/projects/${project_id}/tasks`
          : `/app/projects/${project_id}/chat`,
    });

    return {
      ...file,
      uploader: { id: user_id, ...uploader },
    };
  }

  async listByAttachment(
    project_id: string,
    user_id: string,
    attach_type: 'task' | 'message',
    attach_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const rows = await this.db
      .select({
        file: files,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(files)
      .leftJoin(users, eq(users.id, files.uploaded_by))
      .where(
        and(
          eq(files.project_id, project_id),
          eq(files.attach_type, attach_type),
          eq(files.attach_id, attach_id),
        ),
      );

    return rows.map((r) => ({
      ...r.file,
      uploader: {
        id: r.file.uploaded_by,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
      },
    }));
  }

  async listByProject(project_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const rows = await this.db
      .select({
        file: files,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(files)
      .leftJoin(users, eq(users.id, files.uploaded_by))
      .where(eq(files.project_id, project_id));

    return rows.map((r) => ({
      ...r.file,
      uploader: {
        id: r.file.uploaded_by,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
      },
    }));
  }

  /** Personal aggregation: every file from a task or chat the user is actually a member of, across all their projects. */
  async listForUser(user_id: string) {
    const myProjects = await this.db
      .select({ project_id: members.project_id })
      .from(members)
      .where(and(eq(members.user_id, user_id), eq(members.status, 'active')));

    const projectIds = myProjects.map((m) => m.project_id);
    if (projectIds.length === 0) return [];

    const myDmChannels = await this.db
      .select({ channel_id: channel_members.channel_id })
      .from(channel_members)
      .where(eq(channel_members.user_id, user_id));
    const myDmChannelIds = myDmChannels.map((c) => c.channel_id);

    const rows = await this.db
      .select({
        file: files,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
        project_name: projects.name,
        task_title: tasks.title,
        task_number: tasks.task_number,
        channel_type: channels.type,
        channel_name: channels.name,
      })
      .from(files)
      .leftJoin(users, eq(users.id, files.uploaded_by))
      .leftJoin(projects, eq(projects.id, files.project_id))
      .leftJoin(
        tasks,
        and(eq(files.attach_type, 'task'), eq(tasks.id, files.attach_id)),
      )
      .leftJoin(
        channels,
        and(eq(files.attach_type, 'message'), eq(channels.id, files.attach_id)),
      )
      .where(
        and(
          inArray(files.project_id, projectIds),
          or(
            eq(files.attach_type, 'task'),
            eq(channels.type, 'group'),
            eq(channels.type, 'task_comment'),
            myDmChannelIds.length > 0
              ? inArray(channels.id, myDmChannelIds)
              : undefined,
          ),
        ),
      )
      .orderBy(desc(files.created_at));

    return rows.map((r) => ({
      ...r.file,
      uploader: {
        id: r.file.uploaded_by,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
      },
      project_name: r.project_name,
      source_label:
        r.file.attach_type === 'task'
          ? r.task_title
            ? `#${r.task_number} ${r.task_title}`
            : 'a task'
          : r.channel_type === 'task_comment'
            ? 'a task comment'
            : r.channel_type === 'dm'
              ? 'a direct message'
              : 'group chat',
    }));
  }

  async remove(project_id: string, file_id: string, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);

    const [file] = await this.db
      .select()
      .from(files)
      .where(
        and(eq(files.id, file_id), eq(files.project_id, project_id)),
      )
      .limit(1);

    if (!file) throw new NotFoundException('File not found');

    if (member.role !== 'manager' && file.uploaded_by !== user_id) {
      throw new ForbiddenException(
        'Only the uploader or a manager can delete this file',
      );
    }

    await this.cloudinary.remove(file.cloudinary_id);
    await this.db.delete(files).where(eq(files.id, file_id));
  }

  /**
   * Deletes the Cloudinary assets for every file under a project before the
   * project row is deleted. The `files` DB rows cascade-delete via FK, but
   * Cloudinary storage does not — call this first or the blobs leak forever.
   */
  async removeAllForProject(project_id: string) {
    const rows = await this.db
      .select({ cloudinary_id: files.cloudinary_id })
      .from(files)
      .where(eq(files.project_id, project_id));

    await Promise.all(rows.map((f) => this.cloudinary.remove(f.cloudinary_id)));
  }

  /** Same as removeAllForProject, scoped to files attached to a single task before it's deleted. */
  async removeAllForTask(project_id: string, task_id: string) {
    const rows = await this.db
      .select({ cloudinary_id: files.cloudinary_id })
      .from(files)
      .where(
        and(
          eq(files.project_id, project_id),
          eq(files.attach_type, 'task'),
          eq(files.attach_id, task_id),
        ),
      );

    await Promise.all(rows.map((f) => this.cloudinary.remove(f.cloudinary_id)));
  }

  private async requireActiveMember(project_id: string, user_id: string) {
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
