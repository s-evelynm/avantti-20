import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useApp, formatDate } from "@/lib/store";
import type { Idea } from "@/lib/types";

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
  const [feedbackIdea, setFeedbackIdea] = useState<Idea | null>(null);
  const minhas = ideas.filter((i) => i.authorId === currentUser.id);

  return (
    <div>
      <PageHeader
        title="Minhas ideias"
        description="Acompanhe onde cada ideia sua está no processo."
        action={
          <Button asChild variant="outline">
            <Link to="/explorar">Ver desafios abertos</Link>
          </Button>
        }
      />

      <ul className="space-y-4">
        {minhas.map((idea) => {
          const challenge = challenges.find((c) => c.id === idea.challengeId);
          const stages = funnelOfChallenge(idea.challengeId).stages;
          const atual = stages.findIndex((s) => s.id === idea.currentStageId);
          const decidida = Boolean(idea.decision);
          const aprovada = idea.decision?.result === "aprovada";

          return (
            <li key={idea.id} className="rounded-xl border bg-card p-5">
              <p className="text-base font-semibold text-foreground">{idea.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {challenge?.title} · enviada em {formatDate(idea.createdAt)}
              </p>

              <ol className="mt-4 grid gap-x-4 gap-y-3" style={{ gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))` }}>
                {stages.map((s, i) => {
                  const concluida = atual >= 0 && i < atual;
                  const corrente = i === atual;
                  const cor = decidida && corrente
                    ? "bg-primary"
                    : concluida
                      ? "bg-success"
                      : corrente
                        ? "bg-primary"
                        : "bg-border";
                  return (
                    <li key={s.id} className="min-w-0">
                      <div className={`h-1 rounded-full ${cor}`} aria-hidden />
                      <p
                        className={`mt-2 truncate text-center text-xs ${
                          corrente ? "font-semibold text-foreground" : "text-muted-foreground"
                        }`}
                        title={s.name}
                      >
                        {s.name}
                      </p>
                    </li>
                  );
                })}
              </ol>

              {(decidida || idea.feedback?.approved) && (
                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  {decidida ? (
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        aprovada ? "bg-success-soft text-success" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {aprovada ? "Aprovada" : "Não aprovada"}
                    </span>
                  ) : (
                    <span />
                  )}
                  {idea.feedback?.approved && (
                    <Button variant="outline" size="sm" onClick={() => setFeedbackIdea(idea)}>
                      Ver feedback
                      <ArrowUpRight className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              )}
            </li>
          );
        })}

        {minhas.length === 0 && (
          <li className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground">
            Você ainda não enviou nenhuma ideia. Comece pelos desafios abertos.
          </li>
        )}
      </ul>

      <Dialog open={Boolean(feedbackIdea)} onOpenChange={(o) => !o && setFeedbackIdea(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Retorno sobre “{feedbackIdea?.title}”</DialogTitle>
            <DialogDescription>
              Retorno aprovado por {feedbackIdea?.feedback?.approvedBy ?? "responsável"}.
            </DialogDescription>
          </DialogHeader>
          <p className="text-sm">{feedbackIdea?.feedback?.message}</p>
          {feedbackIdea?.decision && (
            <div className="rounded-lg bg-muted p-3 text-sm">
              <p className="label-caps">Justificativa da decisão</p>
              <p className="mt-1">{feedbackIdea.decision.justification}</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
