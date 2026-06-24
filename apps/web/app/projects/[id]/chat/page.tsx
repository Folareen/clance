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
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useProject } from "@/components/project-provider";
import { useAuth } from "@/components/auth-provider";
import { useSocket } from "@/lib/socket";
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
    socket.on("user_typing", handleTyping);
    socket.on("user_stop_typing", handleStopTyping);

    return () => {
      socket.emit("leave_channel", { channel_id: active.id });
      socket.off("new_message", handleNewMessage);
      socket.off("user_typing", handleTyping);
      socket.off("user_stop_typing", handleStopTyping);
      setTypingUsers(new Set());
    };
  }, [socket, active, projectId, user?.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id;
                const name = fullName(msg.sender);
                const ini = initials(name);
                const color = colorFromString(msg.sender_id);

                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isMine && "flex-row-reverse"
                    )}
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 text-white"
                      style={{ backgroundColor: color }}
                    >
                      {ini}
                    </div>
                    <div
                      className={cn("max-w-[75%]", isMine && "text-right")}
                    >
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
                    </div>
                  </div>
                );
              })}
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
            <div className="flex items-end gap-2">
              <label className="p-3 text-content-muted hover:text-content hover:bg-surface-hover rounded-xl transition-colors cursor-pointer shrink-0">
                <Paperclip className="w-4 h-4" />
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <div className="flex-1 relative">
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
                  className="w-full px-4 py-3 rounded-xl border border-stroke bg-surface-secondary text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
                />
              </div>
              <button
                onClick={handleSend}
                disabled={!input.trim() || !connected}
                className="p-3 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl transition-colors shrink-0 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
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
