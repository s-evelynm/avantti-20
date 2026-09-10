import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { useApp } from "@/lib/store";
import { isReady } from "@/lib/evaluation";

export const Route = createFileRoute("/painel/")({
  head: () => ({
    meta: [
      { title: "Painel de acompanhamento — Avantti" },
      {
        name: "description",
        content:
          "Desafios que você acompanha, com a distribuição das ideias pelas etapas do funil de avaliação.",
      },
      { property: "og:title", content: "Painel de acompanhamento — Avantti" },
      {
        property: "og:description",
        content: "Distribuição das ideias pelas etapas do funil, desafio a desafio.",
      },
    ],
  }),
  component: PainelPage,
});

const stageColors = [
  "var(--muted-foreground)",
  "var(--success)",
  "var(--primary)",
  "var(--callout)",
  "var(--cyan)",
  "var(--brand-pink)",
];

function PainelPage() {
  const { challenges, programs, ideas, funnelOfChallenge } = useApp();
  const list = challenges.filter((c) => c.status !== "rascunho");

  return (
    <div>
      <PageHeader title="Painel" description="Desafios que você acompanha." />

      <ul className="space-y-4">
        {list.map((challenge) => {
          const funnel = funnelOfChallenge(challenge.id);
          const challengeIdeas = ideas.filter((i) => i.challengeId === challenge.id);
          const ativas = challengeIdeas.filter((i) => i.currentStageId && !i.decision);
          const perStage = funnel.stages.map((stage, index) => {
            const cards = ativas.filter((i) => i.currentStageId === stage.id);
            return {
              stage,
              count: cards.length,
              color: stageColors[index % stageColors.length]!,
              ready: cards.filter((i) => isReady(challenge, stage, i)).length,
            };
          });
          const total = perStage.reduce((s, p) => s + p.count, 0);
          const prontas = perStage.reduce((s, p) => s + p.ready, 0);

          return (
            <li key={challenge.id}>
              <Link
                to="/painel/$challengeId"
                params={{ challengeId: challenge.id }}
                className="block rounded-xl border bg-card p-5 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-base font-semibold">{challenge.title}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {programs.find((p) => p.id === challenge.programId)?.name} · {ativas.length}{" "}
                      {ativas.length === 1 ? "ideia ativa" : "ideias ativas"}
                    </p>
                  </div>
                  {prontas > 0 && (
                    <span className="rounded-full bg-success-bg px-3 py-1 text-xs font-medium text-success">
                      {prontas === 1 ? "1 pronta para avançar" : `${prontas} prontas para avançar`}
                    </span>
                  )}
                </div>

                {funnel.stages.length === 0 ? (
                  <p className="mt-4 text-sm text-muted-foreground">
                    O programa deste desafio ainda não tem funil montado.
                  </p>
                ) : (
                  <>
                    <div
                      className="mt-4 flex h-2 overflow-hidden rounded-full bg-muted"
                      role="img"
                      aria-label={`Distribuição das ideias: ${perStage
                        .map((p) => `${p.stage.name} ${p.count}`)
                        .join(", ")}`}
                    >
                      {total > 0 ? (
                        perStage.map((p) => (
                          <span
                            key={p.stage.id}
                            style={{
                              width: `${(p.count / total) * 100}%`,
                              backgroundColor: p.color,
                            }}
                          />
                        ))
                      ) : null}
                    </div>
                    <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
                      {perStage.map((p) => (
                        <li key={p.stage.id} className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-[3px]"
                            style={{ backgroundColor: p.color }}
                            aria-hidden
                          />
                          {p.stage.name} ({p.count})
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </Link>
            </li>
          );
        })}
        {list.length === 0 && (
          <li className="rounded-xl border border-dashed bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum desafio aberto para acompanhar ainda.
          </li>
        )}
      </ul>
    </div>
  );
}
