import { cn } from "@/lib/utils";
import { User } from "lucide-react";
import Image from "next/image";

interface AvatarProps {
  src?: string | null;
  alt: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeMap = {
  sm: "size-8",
  md: "size-10",
  lg: "size-32",
};

export function Avatar({ src, alt, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-muted",
        sizeMap[size],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          // Blob URLs are the local preview of a file the user just picked;
          // the optimizer cannot fetch them, and there is nothing to optimize.
          unoptimized={src.startsWith("blob:") || src.startsWith("data:")}
          className="object-cover"
        />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <User className="size-1/2" />
        </div>
      )}
    </div>
  );
}
