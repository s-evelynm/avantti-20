import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useApp, formatMoney } from "@/lib/store";
import type { Program } from "@/lib/types";

export const Route = createFileRoute("/programas/")({
  head: () => ({
    meta: [
      { title: "Programas de inovação — Avantti" },
      {
        name: "description",
        content: "Lista de programas corporativos de inovação, com recurso, público elegível e desafios vinculados.",
      },
      { property: "og:title", content: "Programas de inovação — Avantti" },
      { property: "og:description", content: "Programas corporativos de inovação e seus desafios." },
    ],
  }),
  component: ProgramasPage,
});

export function audienceLabel(p: Program, users: { id: string; name: string }[]) {
  if (p.audience.mode === "todos") return "Todos os colaboradores";
  if (p.audience.mode === "areas") return `Áreas: ${p.audience.areas.join(", ") || "nenhuma"}`;
  return `Privado: ${p.audience.userIds
    .map((id) => users.find((u) => u.id === id)?.name ?? id)
    .join(", ")}`;
}

function ProgramasPage() {
  const { programs, challenges, users, role } = useApp();

  return (
    <div>
      <PageHeader
        title="Programas"
        description="Nível hierárquico acima do desafio. Cada programa reúne contexto, recurso, público elegível e seus desafios."
        action={
          role === "admin" ? (
            <Button asChild>
              <Link to="/programas/novo">Novo programa</Link>
            </Button>
          ) : undefined
        }
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {programs.map((p) => {
          const cs = challenges.filter((c) => c.programId === p.id);
          return (
            <li key={p.id}>
              <Link
                to="/programas/$programId"
                params={{ programId: p.id }}
                className="block h-full rounded-xl border border-l-[3px] border-l-primary bg-card p-4 hover:shadow-sm"
              >
                <h3 className="font-semibold text-primary">{p.name}</h3>
                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{p.context}</p>
                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <dt className="label-caps">Recurso</dt>
                    <dd>{formatMoney(p.resourceAmount, p.resourceCurrency)}</dd>
                  </div>
                  <div>
                    <dt className="label-caps">Desafios</dt>
                    <dd>{cs.length}</dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="label-caps">Público elegível</dt>
                    <dd className="text-muted-foreground">{audienceLabel(p, users)}</dd>
                  </div>
                </dl>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
