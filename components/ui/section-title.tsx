import { cn } from "@/lib/utils";

export default function SectionTitle({
  title,
  size,
}: { title: string; size?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" }) {
  return (
    <span className={cn("font-semibold", size ? `text-${size}` : "")}>
      {title}
    </span>
  );
}
