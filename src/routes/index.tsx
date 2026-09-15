import { createFileRoute, Link } from "@tanstack/react-router";
import { ClipboardCheck, LayoutGrid, Lightbulb, Target } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Início — Avantti, gestão de desafios de inovação" },
      {
        name: "description",
        content:
          "Veja o que fazer agora no Avantti: desafios abertos, avaliações pendentes e o andamento das suas ideias.",
      },
      { property: "og:title", content: "Avantti — Gestão de inovação" },
      {
        property: "og:description",
        content: "Desafios, avaliações e acompanhamento do funil de inovação em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Card({
  to,
  icon: Icon,
  title,
  count,
  hint,
}: {
  to: string;
  icon: typeof Target;
  title: string;
  count: string;
  hint: string;
}) {
  return (
    <Link
      to={to}
      className="rounded-xl border bg-card p-5 transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className="size-4 text-primary" aria-hidden />
        {title}
      </span>
      <span className="mt-3 block text-2xl font-semibold text-primary">{count}</span>
      <span className="mt-1 block text-sm text-muted-foreground">{hint}</span>
    </Link>
  );
}

function Index() {
  const { caps, currentUser, challenges, ideas, funnelOfChallenge } = useApp();

  const abertos = challenges.filter((c) => c.status === "aberto");
  const minhasIdeias = ideas.filter((i) => i.authorId === currentUser.id);
  const emAndamento = minhasIdeias.filter((i) => !i.decision).length;

  const pendentes = ideas.filter((idea) => {
    if (!idea.currentStageId) return false;
    const stage = funnelOfChallenge(idea.challengeId).stages.find(
      (s) => s.id === idea.currentStageId,
    );
    if (!stage) return false;
    if (!(idea.assignments[stage.id] ?? []).includes(currentUser.id)) return false;
    return !idea.evaluations.some((e) => e.stageId === stage.id && e.evaluatorId === currentUser.id);
  }).length;

  const primeiroNome = currentUser.name.split(" ")[0];

  return (
    <div>
      <PageHeader
        title={`Olá, ${primeiroNome}`}
        description="Este é o resumo do que depende de você agora. Escolha por onde começar."
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Card
          to="/explorar"
          icon={Target}
          title="Desafios abertos"
          count={String(abertos.length)}
          hint={
            abertos.length === 0
              ? "Nenhum desafio recebendo ideias no momento."
              : "Veja os desafios e envie uma ideia."
          }
        />
        <Card
          to="/minhas-ideias"
          icon={Lightbulb}
          title="Minhas ideias"
          count={String(minhasIdeias.length)}
          hint={
            minhasIdeias.length === 0
              ? "Você ainda não enviou nenhuma ideia."
              : `${emAndamento} em andamento — acompanhe a etapa de cada uma.`
          }
        />
        {caps.avaliar && (
          <Card
            to="/avaliacoes"
            icon={ClipboardCheck}
            title="Avaliações pendentes"
            count={String(pendentes)}
            hint={
              pendentes === 0
                ? "Nada esperando sua nota agora."
                : "Ideias esperando a sua nota e o seu comentário."
            }
          />
        )}
        {caps.gerenciar && (
          <Card
            to="/painel"
            icon={LayoutGrid}
            title="Desafios que você acompanha"
            count={String(abertos.length)}
            hint="Veja o andamento das ideias em cada etapa."
          />
        )}
      </div>

      <p className="mt-8 rounded-xl border border-dashed bg-card p-4 text-sm text-muted-foreground">
        O menu à esquerda mostra apenas o que a pessoa selecionada em “Você está vendo como” pode
        fazer. Enviar ideias e acompanhar desafios está sempre liberado para todo mundo.
      </p>
    </div>
  );
}
