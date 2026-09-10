import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { HistoryList } from "@/components/HistoryList";
import { StatusBadge } from "@/components/StatusBadge";
import { useApp, formatMoney } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avantti — Gestão de programas e desafios de inovação" },
      {
        name: "description",
        content:
          "Protótipo Avantti: estruture programas de inovação, objetivos estratégicos e desafios com formulário configurável e histórico de alterações.",
      },
      { property: "og:title", content: "Avantti — Gestão de inovação" },
      {
        property: "og:description",
        content: "Programas, objetivos estratégicos e desafios de inovação em um só lugar.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { programs, challenges, ideas, objectives, logs } = useApp();

  const cards = [
    { label: "Programas", value: programs.length, to: "/programas" as const },
    { label: "Desafios", value: challenges.length, to: "/desafios" as const },
    { label: "Objetivos estratégicos", value: objectives.length, to: "/objetivos" as const },
    { label: "Ideias submetidas", value: ideas.length, to: "/desafios" as const },
  ];

  const totalRecurso = programs.reduce((s, p) => s + p.resourceAmount, 0);

  return (
    <div>
      <PageHeader
        title="Visão geral"
        description="Protótipo de demonstração. Os dados vivem apenas nesta sessão e são reiniciados ao recarregar a página."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.to}
            className="rounded-xl border border-l-[3px] border-l-primary bg-card p-4 transition-shadow hover:shadow-sm"
          >
            <p className="label-caps">{c.label}</p>
            <p className="mt-2 text-3xl font-semibold text-primary">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-4 rounded-xl bg-callout p-4 text-callout-foreground">
        <p className="label-caps text-callout-foreground/70">Recurso total alocado nos programas</p>
        <p className="mt-1 text-2xl font-semibold">{formatMoney(totalRecurso)}</p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <section>
          <h2 className="mb-3">Desafios recentes</h2>
          <ul className="space-y-2">
            {challenges.slice(0, 5).map((c) => (
              <li key={c.id}>
                <Link
                  to="/desafios/$challengeId"
                  params={{ challengeId: c.id }}
                  className="flex items-center justify-between gap-3 rounded-lg border bg-card p-3 hover:shadow-sm"
                >
                  <span className="text-sm">{c.title}</span>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
          </ul>
        </section>
        <section>
          <h2 className="mb-3">Histórico global</h2>
          <HistoryList entries={logs.slice(0, 6)} />
        </section>
      </div>
    </div>
  );
}
