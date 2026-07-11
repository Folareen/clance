import {
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import { projects, members, users, tasks, task_assignees } from '../database/schema';
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
import { NotificationService } from '../notification/notification.service';
import { ActivityService } from '../activity/activity.service';

@Injectable()
export class ProjectService {
  constructor(
    @Inject(DRIZZLE) private db: DrizzleDB,
    private email: EmailService,
    private auth: AuthService,
    private notificationService: NotificationService,
    private activity: ActivityService,
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

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'project_updated',
      summary: 'updated the project details',
    });

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

    if (invitee) {
      this.notificationService.create({
        user_id: invitee.id,
        type: 'project_invited',
        title: `${inviter_name} invited you to "${project.name}"`,
        project_id,
        link: `/invite?token=${invite_token}`,
        actor_id: user.id,
      });
    }

    this.activity.log({
      project_id,
      actor_id: user.id,
      type: 'member_invited',
      summary: `invited ${dto.email} as ${dto.role}`,
    });
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

    const managerRows = await this.db
      .select({ user_id: members.user_id })
      .from(members)
      .where(
        and(
          eq(members.project_id, member.project_id),
          eq(members.role, 'manager'),
          eq(members.status, 'active'),
        ),
      );

    const [project] = await this.db
      .select({ name: projects.name })
      .from(projects)
      .where(eq(projects.id, member.project_id))
      .limit(1);

    const joinerName = await this.getUserDisplayName(user.id);
    this.notificationService.createMany(
      managerRows.map((r) => r.user_id).filter((id): id is string => !!id),
      {
        type: 'member_joined',
        title: `${joinerName} joined "${project?.name ?? 'the project'}"`,
        project_id: member.project_id,
        link: `/app/projects/${member.project_id}`,
        actor_id: user.id,
      },
    );

    this.activity.log({
      project_id: member.project_id,
      actor_id: user.id,
      type: 'member_joined',
      summary: `${joinerName} joined the project`,
    });
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

    await this.unassignSoleTasksFor(project_id, member.id);
    await this.db.delete(members).where(eq(members.id, member.id));

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'member_removed',
      summary: `${member.email} left the project`,
    });
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

    await this.unassignSoleTasksFor(project_id, member_id);
    await this.db.delete(members).where(eq(members.id, member_id));

    this.activity.log({
      project_id,
      actor_id: user_id,
      type: 'member_removed',
      summary: `removed ${member.email} from the project`,
    });
  }

  /** Resets tasks to `backlog` if the given member is their only assignee, before that member's rows cascade-delete. */
  private async unassignSoleTasksFor(project_id: string, member_id: string) {
    const assignedTasks = await this.db
      .select({ task_id: task_assignees.task_id })
      .from(task_assignees)
      .innerJoin(tasks, eq(tasks.id, task_assignees.task_id))
      .where(
        and(
          eq(tasks.project_id, project_id),
          eq(task_assignees.member_id, member_id),
        ),
      );

    if (assignedTasks.length === 0) return;
    const taskIds = assignedTasks.map((t) => t.task_id);

    const otherAssigneeCounts = await this.db
      .select({
        task_id: task_assignees.task_id,
        count: sql<number>`count(*)::int`,
      })
      .from(task_assignees)
      .where(sql`${task_assignees.task_id} IN ${taskIds}`)
      .groupBy(task_assignees.task_id);

    const soleAssignedTaskIds = taskIds.filter((id) => {
      const row = otherAssigneeCounts.find((c) => c.task_id === id);
      return (row?.count ?? 0) <= 1;
    });

    if (soleAssignedTaskIds.length === 0) return;

    await this.db
      .update(tasks)
      .set({ status: 'backlog', updated_at: new Date() })
      .where(sql`${tasks.id} IN ${soleAssignedTaskIds}`);
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

    if (member.role === 'manager' && dto.role === 'worker') {
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
          'Cannot demote the only manager. Promote another member first.',
        );
      }
    }

    await this.db
      .update(members)
      .set(dto)
      .where(eq(members.id, member_id));

    if (dto.role && dto.role !== member.role) {
      this.activity.log({
        project_id,
        actor_id: user_id,
        type: 'member_role_changed',
        summary: `changed ${member.email}'s role to ${dto.role}`,
      });
    }
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
