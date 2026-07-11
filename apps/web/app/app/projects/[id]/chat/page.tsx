"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Send,
  Hash,
  MessageCircle,
  Users,
  Plus,
  Loader2,
  X,
  Paperclip,
  FileIcon,
  Image as ImageIcon,
  Download,
  SmilePlus,
  MessageSquare,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { useSocket, getSocket } from "@/lib/socket";
import {
  api,
  type Channel,
  type DmChannel,
  type Message,
  type Member,
  type FileRecord,
} from "@/lib/api";
import { fullName, initials, colorFromString } from "@/lib/display";

type AnyChannel =
  | (Channel & { kind: "group" })
  | (DmChannel & { kind: "dm" });

export default function ProjectChat() {
  const { project } = useProject();
  const { user } = useAuth();
  const { socket, connected } = useSocket();

  const [channels, setChannels] = useState<AnyChannel[]>([]);
  const [active, setActive] = useState<AnyChannel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [showNewChannel, setShowNewChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [showDmPicker, setShowDmPicker] = useState(false);
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set());
  const [openThread, setOpenThread] = useState<Message | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingRef = useRef(false);

  const projectId = project?.id ?? "";

  const loadChannels = useCallback(async () => {
    if (!projectId) return;
    try {
      const data = await api.listChannels(projectId);
      const all: AnyChannel[] = [
        ...data.group.map((c) => ({ ...c, kind: "group" as const })),
        ...data.dm.map((c) => ({ ...c, kind: "dm" as const })),
      ];
      setChannels(all);
      return all;
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadChannels().then((all) => {
      if (all && all.length > 0 && !active) {
        setActive(all[0]);
      }
    });
  }, [loadChannels]);

  useEffect(() => {
    if (!active || !projectId) return;
    setMsgLoading(true);
    api
      .getMessages(projectId, active.id)
      .then((data) => {
        setMessages(data.messages);
      })
      .catch(() => {})
      .finally(() => setMsgLoading(false));
  }, [active, projectId]);

  useEffect(() => {
    if (!socket || !active || !projectId) return;

    socket.emit("join_channel", {
      project_id: projectId,
      channel_id: active.id,
    });

    const handleNewMessage = (msg: Message) => {
      if (msg.channel_id === active.id) {
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
      }
    };

    const handleNewReply = (msg: Message & { parent_message_id: string }) => {
      if (msg.channel_id !== active.id) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === msg.parent_message_id
            ? { ...m, reply_count: m.reply_count + 1 }
            : m
        )
      );
      setOpenThread((prev) =>
        prev && prev.id === msg.parent_message_id
          ? { ...prev, reply_count: prev.reply_count + 1 }
          : prev
      );
    };

    const handleReactionUpdated = (data: {
      message_id: string;
      emoji: string;
      user_id: string;
      reacted: boolean;
    }) => {
      const applyReaction = (m: Message): Message => {
        if (m.id !== data.message_id) return m;
        const existing = m.reactions.find((r) => r.emoji === data.emoji);
        let reactions: Message["reactions"];
        if (data.reacted) {
          reactions = existing
            ? m.reactions.map((r) =>
                r.emoji === data.emoji
                  ? {
                      ...r,
                      count: r.count + 1,
                      reacted: data.user_id === user?.id ? true : r.reacted,
                    }
                  : r
              )
            : [
                ...m.reactions,
                { emoji: data.emoji, count: 1, reacted: data.user_id === user?.id },
              ];
        } else {
          reactions = m.reactions
            .map((r) =>
              r.emoji === data.emoji
                ? {
                    ...r,
                    count: Math.max(0, r.count - 1),
                    reacted: data.user_id === user?.id ? false : r.reacted,
                  }
                : r
            )
            .filter((r) => r.count > 0);
        }
        return { ...m, reactions };
      };

      setMessages((prev) => prev.map(applyReaction));
      setOpenThread((prev) => (prev ? applyReaction(prev) : prev));
    };

    const handleTyping = (data: { user_id: string; channel_id: string }) => {
      if (data.channel_id === active.id && data.user_id !== user?.id) {
        setTypingUsers((prev) => new Set(prev).add(data.user_id));
      }
    };

    const handleStopTyping = (data: {
      user_id: string;
      channel_id: string;
    }) => {
      if (data.channel_id === active.id) {
        setTypingUsers((prev) => {
          const next = new Set(prev);
          next.delete(data.user_id);
          return next;
        });
      }
    };

    socket.on("new_message", handleNewMessage);
    socket.on("new_reply", handleNewReply);
    socket.on("reaction_updated", handleReactionUpdated);
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.emit("leave_channel", { channel_id: active.id });
      socket.off("new_message", handleNewMessage);
      socket.off("new_reply", handleNewReply);
      socket.off("reaction_updated", handleReactionUpdated);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      setTypingUsers(new Set());
    };
  }, [socket, active, projectId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setOpenThread(null);
  }, [active?.id]);

  const handleReact = (messageId: string, emoji: string) => {
    if (!socket || !active || !projectId) return;
    socket.emit("toggle_reaction", {
      project_id: projectId,
      channel_id: active.id,
      message_id: messageId,
      emoji,
    });
  };

  const openMessageThread = async (msg: Message) => {
    setOpenThread(msg);
    if (!projectId || !active) return;
    try {
      const data = await api.getThread(projectId, active.id, msg.id);
      setOpenThread(data.parent);
    } catch {}
  };

  const handleSend = () => {
    if (!input.trim() || !socket || !active || !projectId) return;

    socket.emit("send_message", {
      project_id: projectId,
      channel_id: active.id,
      content: input.trim(),
    });

    if (isTypingRef.current) {
      socket.emit("stop_typing", { channel_id: active.id });
      isTypingRef.current = false;
    }

    setInput("");
  };

  const handleInputChange = (value: string) => {
    setInput(value);

    if (!socket || !active) return;

    if (!isTypingRef.current) {
      socket.emit("typing", { channel_id: active.id });
      isTypingRef.current = true;
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        socket.emit("stop_typing", { channel_id: active.id });
        isTypingRef.current = false;
      }
    }, 2000);
  };

  const handleCreateChannel = async () => {
    if (!newChannelName.trim() || !projectId) return;
    try {
      const ch = await api.createChannel(projectId, newChannelName.trim());
      const newCh: AnyChannel = { ...ch, kind: "group" };
      setChannels((prev) => [...prev, newCh]);
      setActive(newCh);
      setShowNewChannel(false);
      setNewChannelName("");
    } catch {}
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList?.length || !active || !projectId) return;
    for (const file of Array.from(fileList)) {
      try {
        const uploaded = await api.uploadChatFile(projectId, active.id, file);
        socket?.emit("send_message", {
          project_id: projectId,
          channel_id: active.id,
          content: `[file:${uploaded.filename}](${uploaded.url})`,
        });
      } catch {}
    }
    e.target.value = "";
  };

  const handleCreateDm = async (member: Member) => {
    if (!member.user_id || !projectId) return;
    try {
      const ch = await api.createDm(projectId, member.user_id);
      setShowDmPicker(false);
      await loadChannels().then((all) => {
        const found = all?.find((c) => c.id === ch.id);
        if (found) setActive(found);
      });
    } catch {}
  };

  const channelDisplayName = (c: AnyChannel) => {
    if (c.kind === "dm") {
      const dm = c as DmChannel;
      return fullName(dm.peer) || dm.peer.email;
    }
    return c.name ?? "unnamed";
  };

  const activeMembers = project?.members.filter(
    (m) => m.status === "active" && m.user_id !== user?.id
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 text-content-muted animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex h-screen md:h-screen">
      {/* Sidebar */}
      <div className="w-[220px] min-w-[220px] hidden lg:flex flex-col border-r border-stroke bg-surface">
        <div className="px-4 h-14 flex items-center border-b border-stroke-secondary">
          <h2 className="font-semibold text-content">Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <div className="flex items-center justify-between px-2 py-1.5">
            <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Hash className="w-3 h-3" /> Channels
            </p>
            <button
              onClick={() => setShowNewChannel(true)}
              className="text-content-muted hover:text-content transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showNewChannel && (
            <div className="px-2 py-1 flex gap-1">
              <input
                autoFocus
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateChannel();
                  if (e.key === "Escape") setShowNewChannel(false);
                }}
                placeholder="channel-name"
                className="flex-1 px-2 py-1 text-sm rounded border border-stroke bg-surface-secondary text-content placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-accent"
              />
              <button
                onClick={() => setShowNewChannel(false)}
                className="text-content-muted hover:text-content"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {channels
            .filter((c) => c.kind === "group")
            .map((c) => (
              <ChannelBtn
                key={c.id}
                name={c.name ?? ""}
                type="group"
                isActive={active?.id === c.id}
                onClick={() => setActive(c)}
              />
            ))}

          <div className="flex items-center justify-between px-2 py-1.5 mt-2">
            <p className="text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3 h-3" /> Direct messages
            </p>
            <button
              onClick={() => setShowDmPicker(!showDmPicker)}
              className="text-content-muted hover:text-content transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {showDmPicker && activeMembers && (
            <div className="px-2 py-1 space-y-0.5">
              {activeMembers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => handleCreateDm(m)}
                  className="w-full text-left px-2 py-1.5 text-sm text-content-secondary hover:bg-surface-hover hover:text-content rounded-md transition-colors truncate"
                >
                  {m.email}
                </button>
              ))}
            </div>
          )}

          {channels
            .filter((c) => c.kind === "dm")
            .map((c) => (
              <ChannelBtn
                key={c.id}
                name={channelDisplayName(c)}
                type="dm"
                isActive={active?.id === c.id}
                onClick={() => setActive(c)}
              />
            ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-surface-secondary">
        <div className="flex items-center gap-2 px-6 h-14 border-b border-stroke bg-surface">
          {active?.kind === "group" ? (
            <Hash className="w-4 h-4 text-content-muted" />
          ) : (
            <MessageCircle className="w-4 h-4 text-content-muted" />
          )}
          <h3 className="font-semibold text-content">
            {active ? channelDisplayName(active) : "Select a channel"}
          </h3>
          {!connected && (
            <span className="ml-auto text-xs text-warning">Connecting...</span>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          {msgLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-content-muted">
              <MessageCircle className="w-10 h-10 mb-3 opacity-40" />
              <p className="text-sm">
                No messages yet. Start the conversation!
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 border-t border-stroke" />
                <span className="text-xs text-content-muted font-medium">
                  Messages
                </span>
                <div className="flex-1 border-t border-stroke" />
              </div>
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isMine={msg.sender_id === user?.id}
                  onReact={(emoji) => handleReact(msg.id, emoji)}
                  onOpenThread={() => openMessageThread(msg)}
                />
              ))}
            </>
          )}

          {typingUsers.size > 0 && (
            <div className="text-xs text-content-muted italic pl-11">
              Someone is typing...
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {active && (
          <div className="px-4 sm:px-6 py-4 border-t border-stroke bg-surface">
            <div className="flex items-center gap-2">
              <label className="flex items-center justify-center w-10 h-10 text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition-colors cursor-pointer shrink-0">
                <Paperclip className="w-5 h-5" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <textarea
                value={input}
                onChange={(e) => handleInputChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={`Message ${active.kind === "group" ? "#" : ""}${channelDisplayName(active)}...`}
                rows={1}
                className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-stroke bg-surface-secondary text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || !connected}
                className="flex items-center justify-center w-10 h-10 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {openThread && active && projectId && (
        <ThreadPanel
          parent={openThread}
          projectId={projectId}
          channelId={active.id}
          currentUserId={user?.id}
          onClose={() => setOpenThread(null)}
          onReact={handleReact}
        />
      )}
    </div>
  );
}

function ChannelBtn({
  name,
  type,
  isActive,
  onClick,
}: {
  name: string;
  type: "group" | "dm";
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
        isActive
          ? "bg-accent-soft text-accent font-medium"
          : "text-content-secondary hover:bg-surface-hover hover:text-content"
      )}
    >
      {type === "group" ? (
        <Hash className="w-4 h-4 shrink-0" />
      ) : (
        <MessageCircle className="w-3.5 h-3.5 shrink-0" />
      )}
      <span className="truncate flex-1 text-left">{name}</span>
    </button>
  );
}

const QUICK_REACTIONS = ["👍", "❤️", "😂", "🎉", "👀"];

function ReactionBar({
  reactions,
  onReact,
}: {
  reactions: Message["reactions"];
  onReact: (emoji: string) => void;
}) {
  if (reactions.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1.5">
      {reactions.map((r) => (
        <button
          key={r.emoji}
          onClick={() => onReact(r.emoji)}
          className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors",
            r.reacted
              ? "bg-accent-soft border-accent/40 text-accent"
              : "bg-surface border-stroke text-content-secondary hover:border-accent/30"
          )}
        >
          <span>{r.emoji}</span>
          <span>{r.count}</span>
        </button>
      ))}
    </div>
  );
}

function HoverActions({
  isMine,
  onReact,
  onOpenThread,
}: {
  isMine: boolean;
  onReact: (emoji: string) => void;
  onOpenThread?: () => void;
}) {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <div
      className={cn(
        "absolute top-0 flex items-center gap-0.5 bg-surface border border-stroke rounded-lg shadow-sm px-1 py-0.5 opacity-0 group-hover:opacity-100 transition-opacity",
        isMine ? "-left-2 -translate-x-full" : "-right-2 translate-x-full"
      )}
    >
      <div className="relative">
        <button
          onClick={() => setShowPicker((v) => !v)}
          className="p-1.5 text-content-muted hover:text-content hover:bg-surface-hover rounded-md transition-colors"
          title="React"
        >
          <SmilePlus className="w-3.5 h-3.5" />
        </button>
        {showPicker && (
          <div
            className={cn(
              "absolute top-full mt-1 flex items-center gap-0.5 bg-surface border border-stroke rounded-lg shadow-md p-1 z-10",
              isMine ? "right-0" : "left-0"
            )}
          >
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  onReact(emoji);
                  setShowPicker(false);
                }}
                className="text-base hover:scale-125 transition-transform p-0.5"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
      {onOpenThread && (
        <button
          onClick={onOpenThread}
          className="p-1.5 text-content-muted hover:text-content hover:bg-surface-hover rounded-md transition-colors"
          title="Reply in thread"
        >
          <MessageSquare className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  msg,
  isMine,
  onReact,
  onOpenThread,
}: {
  msg: Message;
  isMine: boolean;
  onReact: (emoji: string) => void;
  onOpenThread?: () => void;
}) {
  const name = fullName(msg.sender);
  const ini = initials(name);
  const color = colorFromString(msg.sender_id);

  return (
    <div className={cn("flex gap-3 group", isMine && "flex-row-reverse")}>
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 text-white"
        style={{ backgroundColor: color }}
      >
        {ini}
      </div>
      <div className={cn("max-w-[75%] relative", isMine && "text-right")}>
        <div
          className={cn(
            "flex items-center gap-2 mb-1",
            isMine && "justify-end"
          )}
        >
          <span className="text-xs font-medium text-content">
            {isMine ? "You" : name}
          </span>
          <span className="text-[11px] text-content-muted">
            {formatTime(msg.created_at)}
          </span>
        </div>
        <MessageContent content={msg.content} isMine={isMine} />
        <ReactionBar reactions={msg.reactions} onReact={onReact} />
        {onOpenThread && msg.reply_count > 0 && (
          <button
            onClick={onOpenThread}
            className="flex items-center gap-1.5 mt-1.5 text-xs text-accent hover:underline"
          >
            <MessageSquare className="w-3 h-3" />
            {msg.reply_count} {msg.reply_count === 1 ? "reply" : "replies"}
          </button>
        )}
        <HoverActions isMine={isMine} onReact={onReact} onOpenThread={onOpenThread} />
      </div>
    </div>
  );
}

function ThreadPanel({
  parent,
  projectId,
  channelId,
  currentUserId,
  onClose,
  onReact,
}: {
  parent: Message;
  projectId: string;
  channelId: string;
  currentUserId: string | undefined;
  onClose: () => void;
  onReact: (messageId: string, emoji: string) => void;
}) {
  const [replies, setReplies] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const repliesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setLoading(true);
    api
      .getThread(projectId, channelId, parent.id)
      .then((data) => setReplies(data.replies))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [projectId, channelId, parent.id]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewReply = (msg: Message & { parent_message_id: string }) => {
      if (msg.parent_message_id !== parent.id) return;
      setReplies((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };

    const handleReactionUpdated = (data: {
      message_id: string;
      emoji: string;
      user_id: string;
      reacted: boolean;
    }) => {
      setReplies((prev) =>
        prev.map((m) => {
          if (m.id !== data.message_id) return m;
          const existing = m.reactions.find((r) => r.emoji === data.emoji);
          let reactions: Message["reactions"];
          if (data.reacted) {
            reactions = existing
              ? m.reactions.map((r) =>
                  r.emoji === data.emoji ? { ...r, count: r.count + 1 } : r
                )
              : [...m.reactions, { emoji: data.emoji, count: 1, reacted: true }];
          } else {
            reactions = m.reactions
              .map((r) =>
                r.emoji === data.emoji ? { ...r, count: Math.max(0, r.count - 1) } : r
              )
              .filter((r) => r.count > 0);
          }
          return { ...m, reactions };
        })
      );
    };

    socket.on("new_reply", handleNewReply);
    socket.on("reaction_updated", handleReactionUpdated);
    return () => {
      socket.off("new_reply", handleNewReply);
      socket.off("reaction_updated", handleReactionUpdated);
    };
  }, [parent.id]);

  useEffect(() => {
    repliesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [replies]);

  const handleSendReply = () => {
    const socket = getSocket();
    if (!input.trim() || !socket) return;
    socket.emit("send_message", {
      project_id: projectId,
      channel_id: channelId,
      content: input.trim(),
      parent_message_id: parent.id,
    });
    setInput("");
  };

  return (
    <div className="w-90 min-w-90 hidden md:flex flex-col border-l border-stroke bg-surface">
      <div className="flex items-center gap-2 px-4 h-14 border-b border-stroke-secondary shrink-0">
        <button
          onClick={onClose}
          className="text-content-muted hover:text-content transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <h3 className="font-semibold text-content text-sm">Thread</h3>
        <button
          onClick={onClose}
          className="ml-auto text-content-muted hover:text-content transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <MessageBubble
          msg={parent}
          isMine={parent.sender_id === currentUserId}
          onReact={(emoji) => onReact(parent.id, emoji)}
        />

        <div className="flex items-center gap-3 my-2">
          <div className="flex-1 border-t border-stroke" />
          <span className="text-xs text-content-muted font-medium">
            {parent.reply_count} {parent.reply_count === 1 ? "reply" : "replies"}
          </span>
          <div className="flex-1 border-t border-stroke" />
        </div>

        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 text-content-muted animate-spin" />
          </div>
        ) : (
          replies.map((r) => (
            <MessageBubble
              key={r.id}
              msg={r}
              isMine={r.sender_id === currentUserId}
              onReact={(emoji) => onReact(r.id, emoji)}
            />
          ))
        )}
        <div ref={repliesEndRef} />
      </div>

      <div className="px-4 py-3 border-t border-stroke-secondary shrink-0">
        <div className="flex items-center gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendReply();
              }
            }}
            placeholder="Reply in thread..."
            rows={1}
            className="flex-1 min-w-0 px-3.5 py-2 rounded-xl border border-stroke bg-surface-secondary text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
          />
          <button
            onClick={handleSendReply}
            disabled={!input.trim()}
            className="flex items-center justify-center w-9 h-9 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl transition-colors shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

const FILE_LINK_RE = /^\[file:(.+?)\]\((.+?)\)$/;

function MessageContent({ content, isMine }: { content: string; isMine: boolean }) {
  const match = content.match(FILE_LINK_RE);

  if (match) {
    const [, filename, url] = match;
    const isImage = /\.(png|jpe?g|gif|webp|svg)$/i.test(filename);

    if (isImage) {
      return (
        <a href={url} target="_blank" rel="noopener noreferrer" className="block">
          <img
            src={url}
            alt={filename}
            className="max-w-[280px] max-h-[200px] rounded-xl object-cover border border-stroke"
          />
          <span className="text-[11px] text-content-muted mt-1 block truncate max-w-[280px]">
            {filename}
          </span>
        </a>
      );
    }

    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-xl border max-w-[280px]",
          isMine
            ? "border-accent-contrast/20 bg-accent-hover"
            : "border-stroke bg-surface hover:bg-surface-hover"
        )}
      >
        <FileIcon className={cn("w-5 h-5 shrink-0", isMine ? "text-accent-contrast/70" : "text-content-muted")} />
        <span className={cn("text-sm truncate flex-1", isMine ? "text-accent-contrast" : "text-content")}>
          {filename}
        </span>
        <Download className={cn("w-4 h-4 shrink-0", isMine ? "text-accent-contrast/70" : "text-content-muted")} />
      </a>
    );
  }

  return (
    <div
      className={cn(
        "inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-left",
        isMine
          ? "bg-accent text-accent-contrast rounded-br-md"
          : "bg-surface text-content border border-stroke rounded-bl-md"
      )}
    >
      {content}
    </div>
  );
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}
