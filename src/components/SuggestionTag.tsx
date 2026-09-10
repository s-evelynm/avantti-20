import { Sparkles } from "lucide-react";

/** Marca visual para tudo que é sugestão simulada (não calculada). */
export function SuggestionTag({ label = "sugestão" }: { label?: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-warning/40 bg-warning-bg px-2 py-0.5 text-[11px] font-medium text-warning">
      <Sparkles className="h-3 w-3" aria-hidden />
      {label}
    </span>
  );
}
