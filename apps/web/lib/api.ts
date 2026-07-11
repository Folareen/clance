import { SESSION_HINT_COOKIE } from "@/lib/constants";

export interface User {
  id: string;
  email: string;
  username: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

export type Role = "manager" | "worker";
export type MemberStatus = "pending" | "active";

export interface Project {
  id: string;
  name: string;
  description: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
  role?: Role;
  label?: string | null;
}

export interface Member {
  id: string;
  user_id: string | null;
  email: string;
  role: Role;
  label: string | null;
  status: MemberStatus;
  joined_at: string | null;
  username: string | null;
}

export interface ProjectDetail extends Project {
  members: Member[];
}

export type TaskStatus = "backlog" | "in_progress" | "submitted" | "approved";
export type TaskPriority = "urgent" | "high" | "medium" | "low" | "none";

export interface TaskAssignee {
  member_id: string;
  user_id: string | null;
  email: string;
  first_name: string | null;
  last_name: string | null;
}

export interface Task {
  id: string;
  project_id: string;
  parent_id: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  task_number: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  assignees: TaskAssignee[];
}

export interface TaskDetail extends Task {
  subtasks: Task[];
}

export interface NoteAuthor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface Note {
  id: string;
  project_id: string;
  title: string;
  content: any;
  pinned: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  author: NoteAuthor;
}

export interface Channel {
  id: string;
  project_id: string;
  name: string | null;
  type: "group" | "dm";
  created_by: string;
  created_at: string;
}

export interface DmChannel extends Channel {
  peer: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

export interface ChannelList {
  group: Channel[];
  dm: DmChannel[];
}

export interface MessageSender {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  avatar_url: string | null;
}

export interface MessageReaction {
  emoji: string;
  count: number;
  reacted: boolean;
}

export interface Message {
  id: string;
  channel_id: string;
  sender_id: string;
  content: string;
  parent_message_id: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
  sender: MessageSender;
  reply_count: number;
  reactions: MessageReaction[];
}

export interface MessagePage {
  messages: Message[];
  hasMore: boolean;
}

export interface CommentPage extends MessagePage {
  channelId: string | null;
}

export interface FileUploader {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface FileRecord {
  id: string;
  project_id: string;
  uploaded_by: string;
  cloudinary_id: string;
  url: string;
  filename: string;
  mimetype: string | null;
  size: number | null;
  attach_type: "task" | "message";
  attach_id: string;
  created_at: string;
  uploader: FileUploader;
}

export interface PersonalFileRecord extends FileRecord {
  project_name: string | null;
  source_label: string;
}

export type ActivityType =
  | "task_created"
  | "task_status_changed"
  | "task_assigned"
  | "task_deleted"
  | "note_pinned"
  | "note_unpinned"
  | "file_uploaded"
  | "meeting_created"
  | "message_pinned"
  | "member_invited"
  | "member_joined"
  | "member_removed"
  | "member_role_changed"
  | "project_updated";

export interface ActivityActor {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface ActivityEntry {
  id: string;
  project_id: string;
  actor_id: string | null;
  type: ActivityType;
  summary: string;
  body: string | null;
  link: string | null;
  created_at: string;
  actor: ActivityActor | null;
}

export interface MeetingCreator {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
}

export interface Meeting {
  id: string;
  project_id: string;
  task_id: string | null;
  title: string;
  join_url: string;
  created_by: string;
  created_at: string;
  creator: MeetingCreator;
  task_title: string | null;
  task_number: number | null;
}

export interface ProjectRecentTask {
  id: string;
  title: string;
  status: TaskStatus;
  task_number: number;
  due_date: string | null;
}

export interface ProjectStats {
  id: string;
  name: string;
  description: string | null;
  role: string;
  created_at: string;
  member_count: number;
  total_tasks: number;
  open_tasks: number;
  overdue_tasks: number;
  my_tasks: number;
  recent_tasks: ProjectRecentTask[];
}

export interface DashboardStats {
  projects: ProjectStats[];
}

export interface DashboardTaskRef {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  task_number: number;
  updated_at: string;
}

export interface DashboardTaskSummary {
  id: string;
  title: string;
  priority?: TaskPriority;
  due_date: string | null;
  task_number: number;
  updated_at?: string;
}

export interface ProjectDashboard {
  tasks_by_status: {
    backlog: number;
    in_progress: number;
    submitted: number;
    approved: number;
  };
  total_tasks: number;
  overdue_tasks: number;
  my_tasks: number;
  recent_tasks: DashboardTaskRef[];
  role: Role;
  // worker fields
  my_pending_tasks?: DashboardTaskSummary[];
  awaiting_my_action?: DashboardTaskSummary[];
  // manager fields
  awaiting_approval?: DashboardTaskSummary[];
  blocked_overdue?: (DashboardTaskSummary & { assignees: string[] })[];
}

export interface SearchResults {
  tasks: {
    id: string;
    title: string;
    status: TaskStatus;
    priority: TaskPriority;
    task_number: number;
    project_id: string;
    project_name: string;
    updated_at: string;
  }[];
  notes: {
    id: string;
    title: string;
    pinned: boolean;
    project_id: string;
    project_name: string;
    updated_at: string;
  }[];
  messages: {
    id: string;
    content: string;
    channel_id: string;
    sender_first_name: string | null;
    sender_last_name: string | null;
    sender_email: string;
    project_id: string;
    project_name: string;
    channel_name: string | null;
    channel_type: string;
    created_at: string;
    task_id: string | null;
    task_number: number | null;
    task_title: string | null;
  }[];
  files: {
    id: string;
    filename: string;
    url: string;
    mimetype: string | null;
    size: number | null;
    project_id: string;
    project_name: string;
    created_at: string;
  }[];
  members: {
    id: string;
    email: string;
    role: string;
    project_id: string;
    project_name: string;
    first_name: string | null;
    last_name: string | null;
  }[];
}

export type NotificationType =
  | "task_assigned"
  | "task_status_changed"
  | "task_commented"
  | "project_invited"
  | "member_joined"
  | "dm_received"
  | "meeting_created"
  | "mentioned"
  | "message_pinned";

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  project_id: string | null;
  link: string | null;
  read: boolean;
  actor_id: string | null;
  created_at: string;
  actor: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
  } | null;
  project_name: string | null;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

export function hasSessionHint(): boolean {
  if (typeof document === "undefined") return false;
  return document.cookie
    .split("; ")
    .some((c) => c.startsWith(`${SESSION_HINT_COOKIE}=`));
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText;
  try {
    const data = await res.json();
    message = Array.isArray(data.message)
      ? data.message.join(", ")
      : data.message || message;
  } catch {
  }
  return new ApiError(message, res.status);
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown } = {}
): Promise<T> {
  const { method = "GET", body } = options;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) throw await parseError(res);
  if (res.status === 204) return undefined as T;
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  login: (b: { email: string; password: string }) =>
    request<{ user: User }>("/api/auth/login", { method: "POST", body: b }),

  signup: (b: {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) => request<{ user: User }>("/api/auth/signup", { method: "POST", body: b }),

  googleAuth: (id_token: string) =>
    request<{ user: User }>("/api/auth/google", { method: "POST", body: { id_token } }),

  sendCode: (email: string) =>
    request<{ message: string }>("/api/auth/send-code", { method: "POST", body: { email } }),

  verifyCode: (email: string, code: string) =>
    request<{ user: User }>("/api/auth/verify-code", { method: "POST", body: { email, code } }),

  logout: () => request<void>("/api/auth/logout", { method: "POST" }),

  me: () => request<User>("/api/auth/me"),

  requestReset: (email: string) =>
    request<{ message: string }>("/api/auth/request-reset", {
      method: "POST",
      body: { email },
    }),

  resetPassword: (token: string, new_password: string) =>
    request<{ message: string }>("/api/auth/reset-password", {
      method: "POST",
      body: { token, new_password },
    }),

  listProjects: () => request<Project[]>("/api/projects"),

  getProject: (id: string) => request<ProjectDetail>(`/api/projects/${id}`),

  createProject: (b: { name: string; description?: string }) =>
    request<Project>("/api/projects", { method: "POST", body: b }),

  updateProject: (id: string, b: { name?: string; description?: string }) =>
    request<Project>(`/api/projects/${id}`, { method: "PATCH", body: b }),

  deleteProject: (id: string) =>
    request<void>(`/api/projects/${id}`, { method: "DELETE" }),

  inviteMember: (id: string, b: { email: string; role: Role; label?: string }) =>
    request<void>(`/api/projects/${id}/invite`, { method: "POST", body: b }),

  updateMember: (id: string, memberId: string, b: { role?: Role; label?: string }) =>
    request<void>(`/api/projects/${id}/members/${memberId}`, {
      method: "PATCH",
      body: b,
    }),

  removeMember: (id: string, memberId: string) =>
    request<void>(`/api/projects/${id}/members/${memberId}`, { method: "DELETE" }),

  leaveProject: (id: string) =>
    request<void>(`/api/projects/${id}/leave`, { method: "POST" }),

  acceptInvite: (token: string) =>
    request<{ message: string }>("/api/projects/accept-invite", {
      method: "POST",
      body: { token },
    }),

  acceptInviteWithSignup: (b: {
    token: string;
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
  }) =>
    request<{ user: User }>("/api/auth/accept-invite-signup", {
      method: "POST",
      body: b,
    }),

  // Tasks
  listTasks: (projectId: string, filters?: { status?: string; priority?: string; search?: string }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.priority) params.set("priority", filters.priority);
    if (filters?.search) params.set("search", filters.search);
    const qs = params.toString();
    return request<Task[]>(`/api/projects/${projectId}/tasks${qs ? `?${qs}` : ""}`);
  },

  getTask: (projectId: string, taskId: string) =>
    request<TaskDetail>(`/api/projects/${projectId}/tasks/${taskId}`),

  createTask: (projectId: string, b: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string;
    parent_id?: string;
    assignee_ids?: string[];
  }) =>
    request<TaskDetail>(`/api/projects/${projectId}/tasks`, { method: "POST", body: b }),

  updateTask: (projectId: string, taskId: string, b: {
    title?: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    due_date?: string | null;
    parent_id?: string | null;
    comment?: string;
  }) =>
    request<Task>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "PATCH", body: b }),

  deleteTask: (projectId: string, taskId: string) =>
    request<void>(`/api/projects/${projectId}/tasks/${taskId}`, { method: "DELETE" }),

  assignTask: (projectId: string, taskId: string, member_ids: string[]) =>
    request<TaskDetail>(`/api/projects/${projectId}/tasks/${taskId}/assign`, {
      method: "POST",
      body: { member_ids },
    }),

  getComments: (projectId: string, taskId: string) =>
    request<CommentPage>(`/api/projects/${projectId}/tasks/${taskId}/comments`),

  sendComment: (projectId: string, taskId: string, content: string) =>
    request<Message>(`/api/projects/${projectId}/tasks/${taskId}/comments`, {
      method: "POST",
      body: { content },
    }),

  // Notes
  listNotes: (projectId: string) =>
    request<Note[]>(`/api/projects/${projectId}/notes`),

  getNote: (projectId: string, noteId: string) =>
    request<Note>(`/api/projects/${projectId}/notes/${noteId}`),

  createNote: (projectId: string, b: { title: string; content?: any; pinned?: boolean }) =>
    request<Note>(`/api/projects/${projectId}/notes`, { method: "POST", body: b }),

  updateNote: (projectId: string, noteId: string, b: { title?: string; content?: any; pinned?: boolean }) =>
    request<Note>(`/api/projects/${projectId}/notes/${noteId}`, { method: "PATCH", body: b }),

  deleteNote: (projectId: string, noteId: string) =>
    request<void>(`/api/projects/${projectId}/notes/${noteId}`, { method: "DELETE" }),

  // Chat
  listChannels: (projectId: string) =>
    request<ChannelList>(`/api/projects/${projectId}/channels`),

  createChannel: (projectId: string, name: string) =>
    request<Channel>(`/api/projects/${projectId}/channels`, {
      method: "POST",
      body: { name },
    }),

  createDm: (projectId: string, member_user_id: string) =>
    request<Channel>(`/api/projects/${projectId}/channels/dm`, {
      method: "POST",
      body: { member_user_id },
    }),

  getMessages: (projectId: string, channelId: string, cursor?: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    const qs = params.toString();
    return request<MessagePage>(
      `/api/projects/${projectId}/channels/${channelId}/messages${qs ? `?${qs}` : ""}`
    );
  },

  getThread: (projectId: string, channelId: string, messageId: string) =>
    request<{ parent: Message; replies: Message[] }>(
      `/api/projects/${projectId}/channels/${channelId}/messages/${messageId}/thread`
    ),

  toggleReaction: (projectId: string, channelId: string, messageId: string, emoji: string) =>
    request<{ reacted: boolean }>(
      `/api/projects/${projectId}/channels/${channelId}/messages/${messageId}/reactions`,
      { method: "POST", body: { emoji } }
    ),

  togglePin: (projectId: string, channelId: string, messageId: string) =>
    request<{ pinned: boolean }>(
      `/api/projects/${projectId}/channels/${channelId}/messages/${messageId}/pin`,
      { method: "POST" }
    ),

  getPinnedMessages: (projectId: string, channelId: string) =>
    request<Message[]>(`/api/projects/${projectId}/channels/${channelId}/pinned`),

  // Files
  uploadTaskFile: async (projectId: string, taskId: string, file: File): Promise<FileRecord> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/files`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  listTaskFiles: (projectId: string, taskId: string) =>
    request<FileRecord[]>(`/api/projects/${projectId}/tasks/${taskId}/files`),

  deleteFile: (projectId: string, taskId: string, fileId: string) =>
    request<void>(`/api/projects/${projectId}/tasks/${taskId}/files/${fileId}`, {
      method: "DELETE",
    }),

  uploadChatFile: async (projectId: string, channelId: string, file: File): Promise<FileRecord> => {
    const form = new FormData();
    form.append("file", file);
    const res = await fetch(`/api/projects/${projectId}/channels/${channelId}/files`, {
      method: "POST",
      body: form,
    });
    if (!res.ok) throw await parseError(res);
    return res.json();
  },

  listChatFiles: (projectId: string, channelId: string) =>
    request<FileRecord[]>(`/api/projects/${projectId}/channels/${channelId}/files`),

  deleteChatFile: (projectId: string, channelId: string, fileId: string) =>
    request<void>(`/api/projects/${projectId}/channels/${channelId}/files/${fileId}`, {
      method: "DELETE",
    }),

  listProjectFiles: (projectId: string) =>
    request<FileRecord[]>(`/api/projects/${projectId}/files`),

  listMyFiles: () => request<PersonalFileRecord[]>("/api/files"),

  // Meetings
  listMeetings: (projectId: string) =>
    request<Meeting[]>(`/api/projects/${projectId}/meetings`),

  createMeeting: (projectId: string, b: { title: string; task_id?: string }) =>
    request<Meeting>(`/api/projects/${projectId}/meetings`, {
      method: "POST",
      body: b,
    }),

  // Activity
  listActivity: (projectId: string) =>
    request<ActivityEntry[]>(`/api/projects/${projectId}/activity`),

  // Dashboard
  getDashboardStats: () =>
    request<DashboardStats>("/api/dashboard/stats"),

  getProjectDashboard: (projectId: string) =>
    request<ProjectDashboard>(`/api/dashboard/projects/${projectId}`),

  // AI Assistant
  askAssistant: (projectId: string, message: string, history?: { role: 'user' | 'assistant'; content: string }[]) =>
    request<{ reply: string }>(`/api/projects/${projectId}/assistant/ask`, {
      method: "POST",
      body: { message, history },
    }),

  // Search
  search: (query: string) =>
    request<SearchResults>(`/api/search?q=${encodeURIComponent(query)}`),

  // Notifications
  listNotifications: () =>
    request<Notification[]>("/api/notifications"),

  unreadCount: () =>
    request<{ count: number }>("/api/notifications/unread-count"),

  markRead: (id: string) =>
    request<void>(`/api/notifications/${id}/read`, { method: "PATCH" }),

  markAllRead: () =>
    request<void>("/api/notifications/read-all", { method: "POST" }),
};
