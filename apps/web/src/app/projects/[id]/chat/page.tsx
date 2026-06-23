"use client";

import { useState } from "react";
import { Send, Paperclip, Smile, Hash, MessageCircle, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const channels = [
  { id: 1, name: "general", type: "group" as const, unread: 3 },
  { id: 2, name: "design", type: "group" as const, unread: 0 },
  { id: 3, name: "Sarah Chen", type: "dm" as const, unread: 1, online: true },
  { id: 4, name: "Mike Johnson", type: "dm" as const, unread: 0, online: false },
];

const messages = [
  { id: 1, user: "Sarah Chen", initials: "SC", content: "Hey team! I've updated the wireframes for the onboarding flow. Can everyone take a look?", time: "10:24 AM", isMine: false },
  { id: 2, user: "Mike Johnson", initials: "MJ", content: "Nice work! The step-by-step approach looks much cleaner.", time: "10:28 AM", isMine: false },
  { id: 3, user: "Saka Wahab", initials: "SA", content: "Agreed. Can we add a skip option for power users who've used similar tools?", time: "10:31 AM", isMine: true },
  { id: 4, user: "Emma Walsh", initials: "EW", content: "Good point — I'll add it as an optional path. The color tokens I shared yesterday should apply here too.", time: "10:35 AM", isMine: false },
  { id: 5, user: "Saka Wahab", initials: "SA", content: "Perfect. Let's target the revised wireframes by EOD tomorrow. I'll create tasks once we finalize.", time: "10:38 AM", isMine: true },
];

export default function ProjectChat() {
  const [active, setActive] = useState(1);
  const [message, setMessage] = useState("");
  const channel = channels.find((c) => c.id === active);

  return (
    <div className="flex h-screen md:h-screen">
      {/* Channels */}
      <div className="w-[220px] min-w-[220px] hidden lg:flex flex-col border-r border-stroke bg-surface">
        <div className="px-4 h-14 flex items-center border-b border-stroke-secondary">
          <h2 className="font-semibold text-content">Chat</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2">
          <p className="px-2 py-1.5 text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
            <Hash className="w-3 h-3" /> Channels
          </p>
          {channels.filter((c) => c.type === "group").map((c) => (
            <ChannelBtn key={c.id} c={c} active={active} onClick={() => setActive(c.id)} />
          ))}
          <p className="px-2 py-1.5 mt-2 text-[11px] font-semibold text-content-muted uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-3 h-3" /> Direct messages
          </p>
          {channels.filter((c) => c.type === "dm").map((c) => (
            <ChannelBtn key={c.id} c={c} active={active} onClick={() => setActive(c.id)} />
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 flex flex-col bg-surface-secondary">
        <div className="flex items-center gap-2 px-6 h-14 border-b border-stroke bg-surface">
          {channel?.type === "group" ? (
            <Hash className="w-4 h-4 text-content-muted" />
          ) : (
            <MessageCircle className="w-4 h-4 text-content-muted" />
          )}
          <h3 className="font-semibold text-content">{channel?.name}</h3>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-4">
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 border-t border-stroke" />
            <span className="text-xs text-content-muted font-medium">Today</span>
            <div className="flex-1 border-t border-stroke" />
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={cn("flex gap-3", msg.isMine && "flex-row-reverse")}>
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0", msg.isMine ? "bg-accent text-accent-contrast" : "bg-accent-soft text-accent")}>
                {msg.initials}
              </div>
              <div className={cn("max-w-[75%]", msg.isMine && "text-right")}>
                <div className={cn("flex items-center gap-2 mb-1", msg.isMine && "justify-end")}>
                  <span className="text-xs font-medium text-content">{msg.isMine ? "You" : msg.user}</span>
                  <span className="text-[11px] text-content-muted">{msg.time}</span>
                </div>
                <div className={cn("inline-block px-4 py-2.5 rounded-2xl text-sm leading-relaxed text-left", msg.isMine ? "bg-accent text-accent-contrast rounded-br-md" : "bg-surface text-content border border-stroke rounded-bl-md")}>
                  {msg.content}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="px-4 sm:px-6 py-4 border-t border-stroke bg-surface">
          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={`Message ${channel?.type === "group" ? "#" : ""}${channel?.name}...`}
                rows={1}
                className="w-full px-4 py-3 pr-20 rounded-xl border border-stroke bg-surface-secondary text-content text-sm placeholder:text-content-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent transition-all resize-none"
              />
              <div className="absolute right-3 bottom-3 flex items-center gap-1">
                <button className="p-1 text-content-muted hover:text-content transition-colors"><Paperclip className="w-4 h-4" /></button>
                <button className="p-1 text-content-muted hover:text-content transition-colors"><Smile className="w-4 h-4" /></button>
              </div>
            </div>
            <button className="p-3 bg-accent hover:bg-accent-hover text-accent-contrast rounded-xl transition-colors shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelBtn({ c, active, onClick }: { c: (typeof channels)[number]; active: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors",
        active === c.id ? "bg-accent-soft text-accent font-medium" : "text-content-secondary hover:bg-surface-hover hover:text-content"
      )}
    >
      {c.type === "group" ? (
        <Hash className="w-4 h-4 shrink-0" />
      ) : (
        <span className="relative shrink-0">
          <span className="w-2 h-2 block rounded-full" style={{ backgroundColor: c.online ? "var(--success)" : "var(--content-muted)" }} />
        </span>
      )}
      <span className="truncate flex-1 text-left">{c.name}</span>
      {c.unread > 0 && (
        <span className="w-5 h-5 bg-accent text-accent-contrast text-[10px] font-semibold rounded-full flex items-center justify-center">
          {c.unread}
        </span>
      )}
    </button>
  );
}
