import { formatDateTime } from "@/lib/store";
import type { LogEntry } from "@/lib/types";

export function HistoryList({ entries }: { entries: LogEntry[] }) {
  if (entries.length === 0)
    return <p className="text-sm text-muted-foreground">Nenhuma alteração registrada ainda.</p>;

  return (
    <ol className="space-y-3">
      {entries.map((e) => (
        <li key={e.id} className="rounded-lg border border-l-[3px] border-l-primary bg-card p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-sm font-medium">{e.action}</span>
            <span className="text-xs text-muted-foreground">{formatDateTime(e.at)}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{e.detail}</p>
          <p className="mt-1 text-xs text-muted-foreground">por {e.actor}</p>
        </li>
      ))}
    </ol>
  );
}
