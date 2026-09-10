import { statusLabel } from "@/lib/store";
import type { ChallengeStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const map: Record<ChallengeStatus, string> = {
  rascunho: "bg-muted text-muted-foreground border-border",
  aberto: "bg-success-bg text-success border-transparent",
  pausado: "bg-warning-bg text-warning border-transparent",
  encerrado: "bg-danger-bg text-danger border-transparent",
};

export function StatusBadge({ status, className }: { status: ChallengeStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        map[status],
        className,
      )}
    >
      {statusLabel(status)}
    </span>
  );
}
