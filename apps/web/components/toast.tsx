"use client";

import { useEffect, useState } from "react";
import { X, AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastVariant = "error" | "success" | "info";

export interface ToastMessage {
  id: string;
  message: string;
  variant: ToastVariant;
}

const icons: Record<ToastVariant, typeof AlertCircle> = {
  error: AlertCircle,
  success: CheckCircle2,
  info: Info,
};

const styles: Record<ToastVariant, string> = {
  error: "bg-danger-soft border-danger/20 text-danger",
  success: "bg-success-soft border-success/20 text-success",
  info: "bg-accent-soft border-accent/20 text-accent",
};

let addToastFn: ((message: string, variant?: ToastVariant) => void) | null =
  null;

export function toast(message: string, variant: ToastVariant = "error") {
  addToastFn?.(message, variant);
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    addToastFn = (message, variant = "error") => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, message, variant }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    };
    return () => {
      addToastFn = null;
    };
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-2 max-w-sm">
      {toasts.map((t) => {
        const Icon = icons[t.variant];
        return (
          <div
            key={t.id}
            className={cn(
              "flex items-start gap-2 px-4 py-3 rounded-lg border text-sm shadow-lg animate-toast-in",
              styles[t.variant]
            )}
          >
            <Icon className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{t.message}</span>
            <button
              onClick={() =>
                setToasts((prev) => prev.filter((x) => x.id !== t.id))
              }
              className="shrink-0 opacity-60 hover:opacity-100"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
