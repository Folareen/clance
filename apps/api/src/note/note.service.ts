import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, desc } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { notes, members, users } from '../database/schema';
import { CreateNoteDto, UpdateNoteDto } from './dto';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class NoteService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private activity: ActivityService,
  ) {}

  async create(project_id: string, dto: CreateNoteDto, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [note] = await this.db
      .insert(notes)
      .values({
        project_id,
        title: dto.title,
        content: dto.content ?? null,
        pinned: dto.pinned ?? false,
        created_by: user_id,
      })
      .returning();

    return this.enrichNote(note);
  }

  async findAll(project_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const rows = await this.db
      .select({
        note: notes,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(notes)
      .leftJoin(users, eq(users.id, notes.created_by))
      .where(eq(notes.project_id, project_id))
      .orderBy(desc(notes.pinned), desc(notes.created_at));

    return rows.map((r) => ({
      ...r.note,
      author: {
        id: r.note.created_by,
        first_name: r.first_name,
        last_name: r.last_name,
        email: r.email,
      },
    }));
  }

  async findOne(project_id: string, note_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [row] = await this.db
      .select({
        note: notes,
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(notes)
      .leftJoin(users, eq(users.id, notes.created_by))
      .where(and(eq(notes.id, note_id), eq(notes.project_id, project_id)))
      .limit(1);

    if (!row) throw new NotFoundException('Note not found');

    return {
      ...row.note,
      author: {
        id: row.note.created_by,
        first_name: row.first_name,
        last_name: row.last_name,
        email: row.email,
      },
    };
  }

  async update(
    project_id: string,
    note_id: string,
    dto: UpdateNoteDto,
    user_id: string,
  ) {
    await this.requireActiveMember(project_id, user_id);

    const [existing] = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.id, note_id), eq(notes.project_id, project_id)))
      .limit(1);

    if (!existing) throw new NotFoundException('Note not found');

    const set: Record<string, any> = { updated_at: new Date() };
    if (dto.title !== undefined) set.title = dto.title;
    if (dto.content !== undefined) set.content = dto.content;
    if (dto.pinned !== undefined) set.pinned = dto.pinned;

    const [updated] = await this.db
      .update(notes)
      .set(set)
      .where(eq(notes.id, note_id))
      .returning();

    if (dto.pinned !== undefined && dto.pinned !== existing.pinned) {
      this.activity.log({
        project_id,
        actor_id: user_id,
        type: dto.pinned ? 'note_pinned' : 'note_unpinned',
        summary: `${dto.pinned ? 'pinned' : 'unpinned'} note "${updated.title}"`,
        link: `/app/projects/${project_id}/notes`,
      });
    }

    return this.enrichNote(updated);
  }

  async remove(project_id: string, note_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [note] = await this.db
      .select()
      .from(notes)
      .where(and(eq(notes.id, note_id), eq(notes.project_id, project_id)))
      .limit(1);

    if (!note) throw new NotFoundException('Note not found');

    await this.db.delete(notes).where(eq(notes.id, note_id));
  }

  private async enrichNote(note: typeof notes.$inferSelect) {
    const [user] = await this.db
      .select({
        first_name: users.first_name,
        last_name: users.last_name,
        email: users.email,
      })
      .from(users)
      .where(eq(users.id, note.created_by))
      .limit(1);

    return {
      ...note,
      author: {
        id: note.created_by,
        first_name: user?.first_name ?? null,
        last_name: user?.last_name ?? null,
        email: user?.email ?? null,
      },
    };
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
