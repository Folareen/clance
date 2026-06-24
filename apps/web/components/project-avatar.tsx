import Image from "next/image";
import { cn } from "@/lib/utils";
import { colorFromString } from "@/lib/display";

export function ProjectAvatar({
  project,
  size = 40,
  className,
}: {
  project: { name: string; color?: string; cover?: string | null };
  size?: number;
  className?: string;
}) {
  const radius = size <= 32 ? "rounded-md" : "rounded-lg";
  const color = project.color ?? colorFromString(project.name);

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
        backgroundColor: color,
        fontSize: size * 0.4,
      }}
    >
      {project.name.charAt(0).toUpperCase()}
    </div>
  );
}
