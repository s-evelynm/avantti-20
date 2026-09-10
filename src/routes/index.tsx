import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useApp } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Avantti — Gestão de programas e desafios de inovação" },
      {
        name: "description",
        content:
          "Protótipo Avantti: participe de desafios, avalie ideias e acompanhe o funil de inovação da sua empresa.",
      },
      { property: "og:title", content: "Avantti — Gestão de inovação" },
      {
        property: "og:description",
        content: "Desafios, avaliações e acompanhamento do funil de inovação em um só lugar.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { caps } = useApp();
  if (caps.gerenciar) return <Navigate to="/painel" replace />;
  if (caps.avaliar) return <Navigate to="/avaliacoes" replace />;
  return <Navigate to="/explorar" replace />;
}
