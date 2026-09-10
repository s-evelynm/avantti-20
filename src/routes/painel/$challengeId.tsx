import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Breadcrumbs,
  CrumbSeparator,
  CurrentCrumb,
  PageHeader,
  crumbLinkClass,
} from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { FunnelBoard } from "@/components/FunnelBoard";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/painel/$challengeId")({
  head: () => ({
    meta: [
      { title: "Acompanhamento do funil — Avantti" },
      {
        name: "description",
        content:
          "Kanban das ideias do desafio pelas etapas do funil, com distribuição, avaliações, decisão e avanço manual.",
      },
      { property: "og:title", content: "Acompanhamento do funil — Avantti" },
      {
        property: "og:description",
        content: "Ideias do desafio etapa a etapa, sempre com avanço manual.",
      },
    ],
  }),
  component: PainelDesafio,
});

function PainelDesafio() {
  const { challengeId } = Route.useParams();
  const { challenges, programs } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId);

  if (!challenge)
    return (
      <div>
        <PageHeader title="Desafio não encontrado" />
        <Button asChild variant="outline">
          <Link to="/painel">Voltar ao painel</Link>
        </Button>
      </div>
    );

  const program = programs.find((p) => p.id === challenge.programId);

  return (
    <div>
      <Breadcrumbs>
        <Link to="/painel" className={crumbLinkClass}>
          Painel
        </Link>
        <CrumbSeparator />
        <CurrentCrumb label={challenge.title} />
      </Breadcrumbs>

      <PageHeader
        title="Acompanhamento do funil"
        description={`${challenge.title}${program ? ` · ${program.name}` : ""}`}
        action={
          <Button asChild variant="outline">
            <Link
              to="/desafios/$challengeId"
              params={{ challengeId: challenge.id }}
              search={{ aba: "visao" as const }}
            >
              Abrir desafio
            </Link>
          </Button>
        }
      />

      <FunnelBoard challengeId={challenge.id} />
    </div>
  );
}
