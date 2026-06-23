import Image from "next/image";
import { cn } from "@/lib/utils";
import type { Project } from "@/lib/data";

export function ProjectAvatar({
  project,
  size = 40,
  className,
}: {
  project: Pick<Project, "name" | "color" | "cover">;
  size?: number;
  className?: string;
}) {
  const radius = size <= 32 ? "rounded-md" : "rounded-lg";

  if (project.cover) {
    return (
      <Image
        src={project.cover}
        alt=""
        width={size}
        height={size}
        className={cn(radius, "object-cover shrink-0", className)}
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className={cn(
        radius,
        "flex items-center justify-center text-white font-semibold shrink-0",
        className
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: project.color,
        fontSize: size * 0.4,
      }}
    >
      {project.name.charAt(0)}
    </div>
  );
}
