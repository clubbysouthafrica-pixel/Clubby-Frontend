import { cn } from "@/lib/utils";

function SocialLink({
  icon,
  label,
  onClick,
  className,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-xl border bg-background p-2 text-sm font-medium transition hover:bg-muted",
        className,
      )}
    >
      <div className="text-primary text-xl">{icon}</div>
      <div className="text-xs">{label}</div>
    </button>
  );
}

export default SocialLink;
