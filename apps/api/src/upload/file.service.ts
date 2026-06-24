import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { files, members, users } from '../database/schema';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FileService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private cloudinary: CloudinaryService,
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

  async remove(project_id: string, file_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [file] = await this.db
      .select()
      .from(files)
      .where(
        and(eq(files.id, file_id), eq(files.project_id, project_id)),
      )
      .limit(1);

    if (!file) throw new NotFoundException('File not found');

    await this.cloudinary.remove(file.cloudinary_id);
    await this.db.delete(files).where(eq(files.id, file_id));
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
