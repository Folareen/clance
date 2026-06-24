"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { api, ApiError, type ProjectDetail } from "@/lib/api";

type Status = "loading" | "ready" | "notfound" | "error";

interface ProjectContextValue {
  project: ProjectDetail | null;
  status: Status;
  error: string | null;
  reload: () => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | null>(null);

export function useProject() {
  const ctx = useContext(ProjectContext);
  if (!ctx) throw new Error("useProject must be used within ProjectProvider");
  return ctx;
}

export function ProjectProvider({
  id,
  children,
}: {
  id: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [project, setProject] = useState<ProjectDetail | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await api.getProject(id);
      setProject(data);
      setStatus("ready");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        router.replace(`/login?from=${encodeURIComponent(pathname)}`);
        return;
      }
      if (err instanceof ApiError && (err.status === 403 || err.status === 404)) {
        setStatus("notfound");
      } else {
        setError(err instanceof ApiError ? err.message : "Failed to load project");
        setStatus("error");
      }
    }
  }, [id, router, pathname]);

  useEffect(() => {
    setStatus("loading");
    load();
  }, [load]);

  return (
    <ProjectContext.Provider value={{ project, status, error, reload: load }}>
      {children}
    </ProjectContext.Provider>
  );
}
