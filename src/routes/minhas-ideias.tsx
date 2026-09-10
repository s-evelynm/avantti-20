import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { useApp, formatDate } from "@/lib/store";

export const Route = createFileRoute("/minhas-ideias")({
  head: () => ({
    meta: [
      { title: "Minhas ideias — Avantti" },
      {
        name: "description",
        content: "Ideias que você enviou, com o desafio, a etapa atual e o retorno recebido.",
      },
      { property: "og:title", content: "Minhas ideias — Avantti" },
      { property: "og:description", content: "Suas ideias enviadas e o andamento de cada uma." },
    ],
  }),
  component: MinhasIdeias,
});

function MinhasIdeias() {
  const { ideas, challenges, currentUser, funnelOfChallenge } = useApp();
  const minhas = ideas.filter((i) => i.authorId === currentUser.id);

  return (
    <div>
      <PageHeader
        title="Minhas ideias"
        description="Acompanhe o andamento de cada ideia que você enviou."
        action={
          <Button asChild>
            <Link to="/explorar">Ver desafios abertos</Link>
          </Button>
        }
      />

      <ul className="space-y-3">
        {minhas.map((idea) => {
          const challenge = challenges.find((c) => c.id === idea.challengeId);
          const stage = idea.currentStageId
            ? funnelOfChallenge(idea.challengeId).stages.find((s) => s.id === idea.currentStageId)
            : undefined;
          const situacao = idea.decision
            ? idea.decision.result === "aprovada"
              ? "Aprovada"
              : "Reprovada"
            : stage
              ? `Em ${stage.name}`
              : "Em triagem";
          return (
            <li key={idea.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-medium">{idea.title}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {challenge?.title} · enviada em {formatDate(idea.createdAt)}
                  </p>
                </div>
                <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-primary">
                  {situacao}
                </span>
              </div>
              <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{idea.description}</p>
              {idea.feedback?.approved && (
                <div className="mt-3 rounded-lg bg-muted p-3 text-sm">
                  <p className="label-caps">Retorno recebido</p>
                  <p className="mt-1">{idea.feedback.message}</p>
                </div>
              )}
            </li>
          );
        })}
        {minhas.length === 0 && (
          <li className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Você ainda não enviou nenhuma ideia. Comece pelos desafios abertos.
          </li>
        )}
      </ul>
    </div>
  );
}
