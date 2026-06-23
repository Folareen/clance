import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq, and } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { projects, members, users } from '../database/schema';
import { EmailService } from '../email/email.service';
import { AuthService } from '../auth/auth.service';
import { AuthUser } from '../common/decorators/current-user.decorator';
import {
  CreateProjectDto,
  UpdateProjectDto,
  InviteMemberDto,
  UpdateMemberDto,
  AcceptInviteWithSignupDto,
} from './dto';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private email: EmailService,
    private auth: AuthService,
  ) {}

  async create(dto: CreateProjectDto, user: AuthUser) {
    const [project] = await this.db
      .insert(projects)
      .values({
        name: dto.name,
        description: dto.description,
        created_by: user.id,
      })
      .returning();

    await this.db.insert(members).values({
      project_id: project.id,
      user_id: user.id,
      email: user.email,
      role: 'manager',
      status: 'active',
      invited_by: user.id,
      joined_at: new Date(),
    });

    return project;
  }

  async findAllForUser(user_id: string) {
    const user_members = await this.db
      .select({
        project: projects,
        role: members.role,
        status: members.status,
        label: members.label,
      })
      .from(members)
      .innerJoin(projects, eq(projects.id, members.project_id))
      .where(and(eq(members.user_id, user_id), eq(members.status, 'active')));

    return user_members.map((m) => ({
      ...m.project,
      role: m.role,
      label: m.label,
    }));
  }

  async findOne(project_id: string, user_id: string) {
    await this.requireActiveMember(project_id, user_id);

    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, project_id))
      .limit(1);

    if (!project) throw new NotFoundException('Project not found');

    const project_members = await this.db
      .select({
        id: members.id,
        user_id: members.user_id,
        email: members.email,
        role: members.role,
        label: members.label,
        status: members.status,
        joined_at: members.joined_at,
      })
      .from(members)
      .where(eq(members.project_id, project_id));

    return { ...project, members: project_members };
  }

  async update(project_id: string, dto: UpdateProjectDto, user_id: string) {
    await this.requireManager(project_id, user_id);

    const [updated] = await this.db
      .update(projects)
      .set({ ...dto, updated_at: new Date() })
      .where(eq(projects.id, project_id))
      .returning();

    return updated;
  }

  async remove(project_id: string, user_id: string) {
    await this.requireManager(project_id, user_id);

    await this.db.delete(projects).where(eq(projects.id, project_id));
  }

  async invite(project_id: string, dto: InviteMemberDto, user: AuthUser) {
    await this.requireManager(project_id, user.id);

    const [project] = await this.db
      .select()
      .from(projects)
      .where(eq(projects.id, project_id))
      .limit(1);

    if (!project) throw new NotFoundException('Project not found');

    const [existing] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.project_id, project_id),
          eq(members.email, dto.email),
        ),
      )
      .limit(1);

    if (existing) {
      throw new ConflictException('User already invited or a member of this project');
    }

    const invite_token = randomBytes(32).toString('hex');

    const [invitee] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    await this.db.insert(members).values({
      project_id,
      user_id: invitee?.id,
      email: dto.email,
      role: dto.role,
      label: dto.label,
      status: 'pending',
      invite_token,
      invited_by: user.id,
    });

    const inviter_name = await this.getUserDisplayName(user.id);
    await this.email.sendProjectInviteEmail(dto.email, invite_token, project.name, inviter_name);
  }

  async acceptInvite(token: string, user: AuthUser) {
    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.invite_token, token),
          eq(members.status, 'pending'),
        ),
      )
      .limit(1);

    if (!member) throw new NotFoundException('Invalid or expired invite');

    if (member.email !== user.email) {
      throw new ForbiddenException('This invite was sent to a different email');
    }

    await this.db
      .update(members)
      .set({
        user_id: user.id,
        status: 'active',
        invite_token: null,
        joined_at: new Date(),
      })
      .where(eq(members.id, member.id));
  }

  async acceptInviteWithSignup(dto: AcceptInviteWithSignupDto) {
    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.invite_token, dto.token),
          eq(members.status, 'pending'),
        ),
      )
      .limit(1);

    if (!member) throw new NotFoundException('Invalid or expired invite');

    if (member.email !== dto.email) {
      throw new ForbiddenException('This invite was sent to a different email');
    }

    const tokens = await this.auth.signup({
      email: dto.email,
      password: dto.password,
      first_name: dto.first_name,
      last_name: dto.last_name,
    });

    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, dto.email))
      .limit(1);

    await this.db
      .update(members)
      .set({
        user_id: user.id,
        status: 'active',
        invite_token: null,
        joined_at: new Date(),
      })
      .where(eq(members.id, member.id));

    return tokens;
  }

  async leaveProject(project_id: string, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);

    if (member.role === 'manager') {
      const other_managers = await this.db
        .select()
        .from(members)
        .where(
          and(
            eq(members.project_id, project_id),
            eq(members.role, 'manager'),
            eq(members.status, 'active'),
          ),
        );

      if (other_managers.length <= 1) {
        throw new ForbiddenException(
          'Cannot leave as the only manager. Promote another member first.',
        );
      }
    }

    await this.db.delete(members).where(eq(members.id, member.id));
  }

  async removeMember(project_id: string, member_id: string, user_id: string) {
    await this.requireManager(project_id, user_id);

    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, member_id),
          eq(members.project_id, project_id),
        ),
      )
      .limit(1);

    if (!member) throw new NotFoundException('Member not found');

    if (member.user_id === user_id) {
      throw new ForbiddenException('Cannot remove yourself');
    }

    await this.db.delete(members).where(eq(members.id, member_id));
  }

  async updateMember(project_id: string, member_id: string, dto: UpdateMemberDto, user_id: string) {
    await this.requireManager(project_id, user_id);

    const [member] = await this.db
      .select()
      .from(members)
      .where(
        and(
          eq(members.id, member_id),
          eq(members.project_id, project_id),
        ),
      )
      .limit(1);

    if (!member) throw new NotFoundException('Member not found');

    await this.db
      .update(members)
      .set(dto)
      .where(eq(members.id, member_id));
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

  private async requireManager(project_id: string, user_id: string) {
    const member = await this.requireActiveMember(project_id, user_id);
    if (member.role !== 'manager') {
      throw new ForbiddenException('Only managers can perform this action');
    }
    return member;
  }

  private async getUserDisplayName(user_id: string): Promise<string> {
    const [user] = await this.db
      .select({ first_name: users.first_name, last_name: users.last_name, email: users.email })
      .from(users)
      .where(eq(users.id, user_id))
      .limit(1);

    if (user?.first_name) {
      return user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
    }
    return user?.email ?? 'Someone';
  }
}
