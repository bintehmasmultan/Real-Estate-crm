import { cn } from "@/lib/utils";

export function BrandMark({
  className,
  alt = "BINTEHMAS",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <img
      src="/brand/bintehmas-logo.png"
      alt={alt}
      className={cn("h-11 w-11 shrink-0 rounded-xl object-cover", className)}
    />
  );
}
