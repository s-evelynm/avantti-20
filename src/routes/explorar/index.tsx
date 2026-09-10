import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp, formatDate } from "@/lib/store";

export const Route = createFileRoute("/explorar/")({
  head: () => ({
    meta: [
      { title: "Desafios abertos — Avantti" },
      {
        name: "description",
        content: "Veja os desafios de inovação abertos para o seu público e envie sua ideia.",
      },
      { property: "og:title", content: "Desafios abertos — Avantti" },
      { property: "og:description", content: "Desafios de inovação abertos para submissão de ideias." },
    ],
  }),
  component: Explorar,
});

function Explorar() {
  const { challenges, currentUser, visiblePrograms, programs } = useApp();
  const visibleIds = visiblePrograms(currentUser.id).map((p) => p.id);
  const list = challenges.filter((c) => c.status !== "rascunho" && visibleIds.includes(c.programId));

  return (
    <div>
      <PageHeader
        title="Desafios abertos"
        description="Você enxerga apenas os desafios dos programas em que seu perfil é público elegível. Rascunhos nunca aparecem aqui."
      />

      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((c) => (
          <li key={c.id}>
            <Link
              to="/explorar/$challengeId"
              params={{ challengeId: c.id }}
              className="block h-full rounded-xl border border-l-[3px] border-l-primary bg-card p-4 hover:shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="font-semibold text-primary">{c.title}</h3>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{c.context}</p>
              <p className="mt-3 text-xs text-muted-foreground">
                {programs.find((p) => p.id === c.programId)?.name} ·{" "}
                {c.kind === "pontual" ? `Prazo ${formatDate(c.deadline)}` : "Fluxo contínuo"}
              </p>
            </Link>
          </li>
        ))}
        {list.length === 0 && (
          <li className="text-sm text-muted-foreground">
            Nenhum desafio disponível para o seu perfil no momento.
          </li>
        )}
      </ul>
    </div>
  );
}
