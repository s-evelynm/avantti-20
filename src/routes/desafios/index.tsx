import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/AppLayout";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp, formatDate } from "@/lib/store";
import type { ChallengeStatus } from "@/lib/types";

export const Route = createFileRoute("/desafios/")({
  head: () => ({
    meta: [
      { title: "Desafios de inovação — Avantti" },
      {
        name: "description",
        content: "Todos os desafios cadastrados, com programa, estado, tipo, prazo e dono responsável.",
      },
      { property: "og:title", content: "Desafios de inovação — Avantti" },
      { property: "og:description", content: "Desafios cadastrados por programa, com estado e prazo." },
    ],
  }),
  component: DesafiosPage,
});

const rowBg: Record<ChallengeStatus, string> = {
  rascunho: "bg-muted",
  aberto: "bg-success-bg",
  pausado: "bg-warning-bg",
  encerrado: "bg-danger-bg",
};

function DesafiosPage() {
  const { challenges, programs, users, ideas, role } = useApp();
  const [programFilter, setProgramFilter] = useState("todos");
  const [statusFilter, setStatusFilter] = useState("todos");

  const list = challenges.filter(
    (c) =>
      (programFilter === "todos" || c.programId === programFilter) &&
      (statusFilter === "todos" || c.status === statusFilter),
  );

  return (
    <div>
      <PageHeader
        title="Desafios"
        description="Cada desafio pertence a exatamente um programa e passa por Rascunho, Aberto, Pausado e Submissões encerradas."
        action={
          role === "admin" ? (
            <Button asChild>
              <Link to="/desafios/novo" search={{ programa: "" }}>
                Novo desafio
              </Link>
            </Button>
          ) : undefined
        }
      />

      <div className="mb-4 flex flex-wrap gap-3">
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-72" aria-label="Filtrar por programa">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os programas</SelectItem>
            {programs.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-56" aria-label="Filtrar por estado">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os estados</SelectItem>
            <SelectItem value="rascunho">Rascunho</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="pausado">Pausado</SelectItem>
            <SelectItem value="encerrado">Submissões encerradas</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="label-caps p-3">Desafio</th>
              <th className="label-caps p-3">Programa</th>
              <th className="label-caps p-3">Tipo / prazo</th>
              <th className="label-caps p-3">Dono</th>
              <th className="label-caps p-3">Ideias</th>
              <th className="label-caps p-3">Estado</th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} className={`border-b last:border-0 ${rowBg[c.status]}`}>
                <td className="p-3">
                  <Link
                    to="/desafios/$challengeId"
                    params={{ challengeId: c.id }}
                    search={{ aba: "visao" as const }}
                    className="font-medium text-primary underline-offset-2 hover:underline"
                  >
                    {c.title}
                  </Link>
                </td>
                <td className="p-3">{programs.find((p) => p.id === c.programId)?.name}</td>
                <td className="p-3">
                  {c.kind === "pontual" ? `Pontual · ${formatDate(c.deadline)}` : "Contínuo"}
                </td>
                <td className="p-3">{users.find((u) => u.id === c.ownerId)?.name ?? "—"}</td>
                <td className="p-3">{ideas.filter((i) => i.challengeId === c.id).length}</td>
                <td className="p-3">
                  <StatusBadge status={c.status} />
                </td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={6} className="p-6 text-center text-muted-foreground">
                  Nenhum desafio com esses filtros.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
