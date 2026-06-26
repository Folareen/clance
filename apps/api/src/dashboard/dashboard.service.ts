import { Inject, Injectable } from '@nestjs/common';
import { eq, and, sql } from 'drizzle-orm';
import { DRIZZLE, DrizzleDB } from '../database';
import {
  projects,
  members,
  tasks,
  task_assignees,
} from '../database/schema';

@Injectable()
export class DashboardService {
  constructor(@Inject(DRIZZLE) private db: DrizzleDB) {}

  async getStats(user_id: string) {
    const userProjects = await this.db
      .select({
        project_id: members.project_id,
        role: members.role,
        label: members.label,
        member_id: members.id,
        name: projects.name,
        description: projects.description,
        created_at: projects.created_at,
      })
      .from(members)
      .innerJoin(projects, eq(projects.id, members.project_id))
      .where(
        and(eq(members.user_id, user_id), eq(members.status, 'active')),
      );

    if (userProjects.length === 0) {
      return { projects: [] };
    }

    const projectIds = userProjects.map((p) => p.project_id);

    const taskCounts = await this.db
      .select({
        project_id: tasks.project_id,
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${tasks.status} != 'approved')::int`,
        overdue: sql<number>`count(*) filter (where ${tasks.due_date} < now() and ${tasks.status} not in ('approved'))::int`,
      })
      .from(tasks)
      .where(sql`${tasks.project_id} IN ${projectIds}`)
      .groupBy(tasks.project_id);

    const taskCountMap = new Map(taskCounts.map((r) => [r.project_id, r]));

    const memberCounts = await this.db
      .select({
        project_id: members.project_id,
        count: sql<number>`count(*)::int`,
      })
      .from(members)
      .where(
        and(
          sql`${members.project_id} IN ${projectIds}`,
          eq(members.status, 'active'),
        ),
      )
      .groupBy(members.project_id);

    const memberCountMap = new Map(memberCounts.map((r) => [r.project_id, r.count]));

    const memberIds = userProjects.map((p) => p.member_id);

    const myTaskCounts = await this.db
      .select({
        project_id: tasks.project_id,
        count: sql<number>`count(*)::int`,
      })
      .from(task_assignees)
      .innerJoin(tasks, eq(tasks.id, task_assignees.task_id))
      .where(
        and(
          sql`${task_assignees.member_id} IN ${memberIds}`,
          sql`${tasks.status} != 'approved'`,
        ),
      )
      .groupBy(tasks.project_id);

    const myTaskMap = new Map(myTaskCounts.map((r) => [r.project_id, r.count]));

    const recentTasks = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due_date: tasks.due_date,
        task_number: tasks.task_number,
        project_id: tasks.project_id,
        updated_at: tasks.updated_at,
      })
      .from(tasks)
      .where(sql`${tasks.project_id} IN ${projectIds}`)
      .orderBy(sql`${tasks.updated_at} desc`)
      .limit(30);

    const recentByProject = new Map<string, typeof recentTasks>();
    for (const t of recentTasks) {
      const list = recentByProject.get(t.project_id) ?? [];
      if (list.length < 4) list.push(t);
      recentByProject.set(t.project_id, list);
    }

    const projectStats = userProjects.map((p) => {
      const tc = taskCountMap.get(p.project_id);
      return {
        id: p.project_id,
        name: p.name,
        description: p.description,
        role: p.role,
        created_at: p.created_at,
        member_count: memberCountMap.get(p.project_id) ?? 0,
        total_tasks: tc?.total ?? 0,
        open_tasks: tc?.open ?? 0,
        overdue_tasks: tc?.overdue ?? 0,
        my_tasks: myTaskMap.get(p.project_id) ?? 0,
        recent_tasks: (recentByProject.get(p.project_id) ?? []).map((t) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          task_number: t.task_number,
          due_date: t.due_date,
        })),
      };
    });

    return { projects: projectStats };
  }

  async getProjectStats(project_id: string, user_id: string) {
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

    if (!member) return null;

    const [counts] = await this.db
      .select({
        total: sql<number>`count(*)::int`,
        backlog: sql<number>`count(*) filter (where ${tasks.status} = 'backlog')::int`,
        in_progress: sql<number>`count(*) filter (where ${tasks.status} = 'in_progress')::int`,
        submitted: sql<number>`count(*) filter (where ${tasks.status} = 'submitted')::int`,
        approved: sql<number>`count(*) filter (where ${tasks.status} = 'approved')::int`,
        overdue: sql<number>`count(*) filter (where ${tasks.due_date} < now() and ${tasks.status} not in ('approved'))::int`,
      })
      .from(tasks)
      .where(eq(tasks.project_id, project_id));

    const [myResult] = await this.db
      .select({ count: sql<number>`count(distinct ${task_assignees.task_id})::int` })
      .from(task_assignees)
      .innerJoin(tasks, eq(tasks.id, task_assignees.task_id))
      .where(
        and(
          eq(task_assignees.member_id, member.id),
          sql`${tasks.status} != 'approved'`,
        ),
      );

    const recentTasks = await this.db
      .select({
        id: tasks.id,
        title: tasks.title,
        status: tasks.status,
        priority: tasks.priority,
        due_date: tasks.due_date,
        task_number: tasks.task_number,
        updated_at: tasks.updated_at,
      })
      .from(tasks)
      .where(eq(tasks.project_id, project_id))
      .orderBy(sql`${tasks.updated_at} desc`)
      .limit(6);

    return {
      tasks_by_status: {
        backlog: counts.backlog,
        in_progress: counts.in_progress,
        submitted: counts.submitted,
        approved: counts.approved,
      },
      total_tasks: counts.total,
      overdue_tasks: counts.overdue,
      my_tasks: myResult.count,
      recent_tasks: recentTasks,
    };
  }
}
