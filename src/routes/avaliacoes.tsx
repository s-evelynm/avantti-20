import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Minhas avaliações — Avantti" },
      {
        name: "description",
        content: "Ideias distribuídas para você avaliar, com pendentes e concluídas.",
      },
      { property: "og:title", content: "Minhas avaliações — Avantti" },
      { property: "og:description", content: "Fila de avaliação das ideias distribuídas a você." },
    ],
  }),
  component: AvaliacoesPage,
});

function AvaliacoesPage() {
  const { challenges, currentUser } = useApp();
  const meus = challenges.filter(
    (c) => c.evaluatorPoolIds.includes(currentUser.id) || c.committeeIds.includes(currentUser.id),
  );

  return (
    <div>
      <PageHeader
        title="Minhas avaliações"
        description="Espaço de avaliação de ideias. A fila de avaliação e o formulário de notas entram no próximo passo do protótipo."
      />

      <div className="rounded-xl border bg-card p-6">
        <p className="label-caps">Você participa da avaliação destes desafios</p>
        <ul className="mt-4 space-y-2">
          {meus.map((c) => (
            <li key={c.id}>
              <Link
                to="/desafios/$challengeId"
                params={{ challengeId: c.id }}
                search={{ aba: "acompanhamento" }}
                className="block rounded-lg border p-4 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {c.title}
              </Link>
            </li>
          ))}
          {meus.length === 0 && (
            <li className="text-sm text-muted-foreground">
              Nenhuma ideia distribuída para você no momento.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}
