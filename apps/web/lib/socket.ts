"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import { io, Socket } from "socket.io-client";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

let socketInstance: Socket | null = null;
let tokenPromise: Promise<string | null> | null = null;

async function fetchToken(): Promise<string | null> {
  try {
    const res = await fetch("/api/auth/token");
    if (!res.ok) return null;
    const data = await res.json();
    return data.token;
  } catch {
    return null;
  }
}

export function getSocket(): Socket | null {
  return socketInstance;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (socketInstance?.connected) {
      socketRef.current = socketInstance;
      setConnected(true);
      return;
    }

    if (!tokenPromise) {
      tokenPromise = fetchToken();
    }

    let cancelled = false;

    tokenPromise.then((token) => {
      if (cancelled || !token) return;

      if (!socketInstance) {
        socketInstance = io(`${API_URL}/chat`, {
          auth: { token },
          transports: ["websocket", "polling"],
        });
      }

      const s = socketInstance;
      socketRef.current = s;

      s.on("connect", () => {
        if (!cancelled) setConnected(true);
      });

      s.on("disconnect", () => {
        if (!cancelled) setConnected(false);
      });

      if (s.connected) setConnected(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return { socket: socketRef.current ?? socketInstance, connected };
}

export function disconnectSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
    tokenPromise = null;
  }
}
