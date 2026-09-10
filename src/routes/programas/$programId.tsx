import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import {
  Breadcrumbs,
  CrumbSeparator,
  CurrentCrumb,
  PageHeader,
  crumbLinkClass,
} from "@/components/AppLayout";
import { HistoryList } from "@/components/HistoryList";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useApp, formatMoney } from "@/lib/store";
import type { AudienceMode } from "@/lib/types";

type Aba = "visao" | "desafios" | "configuracao";

export const Route = createFileRoute("/programas/$programId")({
  validateSearch: (s: Record<string, unknown>) => ({
    aba: ((s["aba"] as Aba) || "visao") as Aba,
  }),
  head: () => ({
    meta: [
      { title: "Programa — Avantti" },
      {
        name: "description",
        content: "Detalhe do programa: contexto, recurso, público elegível, desafios vinculados e histórico.",
      },
      { property: "og:title", content: "Programa — Avantti" },
      { property: "og:description", content: "Contexto, recurso, público elegível e desafios do programa." },
    ],
  }),
  component: ProgramaDetalhe,
});

function ProgramaDetalhe() {
  const { programId } = Route.useParams();
  const { aba } = Route.useSearch();
  const navigate = useNavigate();
  const {
    programs,
    challenges,
    users,
    areas,
    caps,
    updateProgram,
    deleteProgram,
    logsFor,
    ideas,
  } = useApp();
  const program = programs.find((p) => p.id === programId);
  const [editing, setEditing] = useState(false);

  if (!program)
    return (
      <div>
        <p className="text-muted-foreground">Programa não encontrado.</p>
        <Link to="/programas" className="text-primary underline">
          Voltar para programas
        </Link>
      </div>
    );

  const isAdmin = caps.configurar;
  const programChallenges = challenges.filter((c) => c.programId === program.id);
  const eligible = users.filter((u) =>
    program.audience.mode === "todos"
      ? true
      : program.audience.mode === "areas"
        ? program.audience.areas.includes(u.area)
        : program.audience.userIds.includes(u.id),
  );

  const setAudience = (mode: AudienceMode, patch: Partial<typeof program.audience> = {}) => {
    const next = { ...program.audience, mode, ...patch };
    updateProgram(
      program.id,
      { audience: next },
      `Público elegível alterado para ${
        mode === "todos" ? "Todos" : mode === "areas" ? `áreas (${next.areas.join(", ") || "nenhuma"})` : `usuários específicos (${next.userIds.length})`
      }.`,
    );
    toast.success("Público elegível atualizado");
  };

  return (
    <div>
      <Breadcrumbs>
        <Link to="/programas" className={crumbLinkClass}>
          Programas
        </Link>
        <CrumbSeparator />
        <CurrentCrumb label={program.name} />
      </Breadcrumbs>

      <PageHeader
        title={program.name}
        description={program.context}
        action={
          isAdmin && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setEditing((v) => !v)}>
                {editing ? "Fechar edição" : "Editar programa"}
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="ghost">Excluir</Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-danger">Excluir este programa?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Os {programChallenges.length} desafio(s) vinculados e todas as ideias submetidas
                      serão excluídos junto. Esta ação não pode ser desfeita.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => {
                        deleteProgram(program.id);
                        toast.success("Programa excluído");
                        navigate({ to: "/programas" });
                      }}
                    >
                      Excluir tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )
        }
      />

      {editing && isAdmin && (
        <div className="mb-8 space-y-4 rounded-xl border bg-card p-4">
          <div>
            <Label className="label-caps">Nome</Label>
            <Input id="p-name" defaultValue={program.name} />
          </div>
          <div>
            <Label className="label-caps">Contexto</Label>
            <Textarea id="p-context" rows={4} defaultValue={program.context} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="label-caps">Recurso (R$)</Label>
              <Input id="p-amount" type="number" defaultValue={program.resourceAmount} />
            </div>
            <div>
              <Label className="label-caps">Documento anexado</Label>
              <Input id="p-doc" defaultValue={program.documentName ?? ""} />
            </div>
          </div>
          <div>
            <Label className="label-caps">Observação sobre o recurso</Label>
            <Textarea id="p-note" defaultValue={program.resourceNote} />
          </div>
          <Button
            onClick={() => {
              const v = (id: string) =>
                (document.getElementById(id) as HTMLInputElement | HTMLTextAreaElement).value;
              updateProgram(
                program.id,
                {
                  name: v("p-name"),
                  context: v("p-context"),
                  resourceAmount: Number(v("p-amount")) || 0,
                  documentName: v("p-doc") || undefined,
                  resourceNote: v("p-note"),
                },
                "Dados gerais e recurso atualizados.",
              );
              setEditing(false);
              toast.success("Programa atualizado");
            }}
          >
            Salvar alterações
          </Button>
        </div>
      )}

      <Tabs
        value={aba}
        onValueChange={(v) => navigate({ to: ".", search: { aba: v as Aba }, replace: true })}
      >
        <TabsList>
          <TabsTrigger value="visao">Visão geral</TabsTrigger>
          <TabsTrigger value="desafios">Desafios ({programChallenges.length})</TabsTrigger>
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="visao" className="mt-6 space-y-6">
          <div className="rounded-xl border bg-card p-4">
            <p className="label-caps">Recurso do programa</p>
            <p className="mt-2 text-2xl font-semibold text-primary">
              {formatMoney(program.resourceAmount, program.resourceCurrency)}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{program.resourceNote || "Sem observação."}</p>
            {program.documentName && (
              <p className="mt-4 text-sm">
                <span className="label-caps">Documento anexado</span>
                <br />
                {program.documentName}
              </p>
            )}
          </div>
          <section>
            <h2 className="mb-4">Histórico de alterações</h2>
            <HistoryList entries={logsFor(program.id)} />
          </section>
        </TabsContent>

        <TabsContent value="desafios" className="mt-6">
          {isAdmin && (
            <Button asChild className="mb-4">
              <Link to="/desafios/novo" search={{ programa: program.id }}>
                Novo desafio neste programa
              </Link>
            </Button>
          )}
          <ul className="space-y-2">
            {programChallenges.map((c) => (
              <li key={c.id}>
                <Link
                  to="/desafios/$challengeId"
                  params={{ challengeId: c.id }}
                  search={{ aba: "visao" }}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-l-[3px] border-l-primary bg-card p-4 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                >
                  <div>
                    <p className="text-sm font-medium">{c.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {c.kind === "pontual" ? "Pontual" : "Contínuo"} ·{" "}
                      {ideas.filter((i) => i.challengeId === c.id).length} ideia(s)
                    </p>
                  </div>
                  <StatusBadge status={c.status} />
                </Link>
              </li>
            ))}
            {programChallenges.length === 0 && (
              <li className="text-sm text-muted-foreground">Nenhum desafio vinculado ainda.</li>
            )}
          </ul>
        </TabsContent>

        <TabsContent value="configuracao" className="mt-6 space-y-6">
          <section className="space-y-4">
            <h2>Público elegível</h2>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["todos", "Todos"],
                  ["areas", "Por área/unidade"],
                  ["usuarios", "Usuários específicos (privado)"],
                ] as [AudienceMode, string][]
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  disabled={!isAdmin}
                  onClick={() => setAudience(mode)}
                  className={
                    program.audience.mode === mode
                      ? "rounded-full bg-primary-soft px-4 py-2 text-sm font-medium text-primary"
                      : "rounded-full border px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-60"
                  }
                >
                  {label}
                </button>
              ))}
            </div>

            {program.audience.mode === "areas" && (
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-3">
                {areas.map((a) => (
                  <label key={a} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      disabled={!isAdmin}
                      checked={program.audience.areas.includes(a)}
                      onCheckedChange={(v) =>
                        setAudience("areas", {
                          areas: v
                            ? [...program.audience.areas, a]
                            : program.audience.areas.filter((x) => x !== a),
                        })
                      }
                    />
                    {a}
                  </label>
                ))}
              </div>
            )}

            {program.audience.mode === "usuarios" && (
              <div className="grid gap-4 rounded-xl border bg-card p-4 sm:grid-cols-2">
                {users.map((u) => (
                  <label key={u.id} className="flex items-center gap-2 text-sm">
                    <Checkbox
                      disabled={!isAdmin}
                      checked={program.audience.userIds.includes(u.id)}
                      onCheckedChange={(v) =>
                        setAudience("usuarios", {
                          userIds: v
                            ? [...program.audience.userIds, u.id]
                            : program.audience.userIds.filter((x) => x !== u.id),
                        })
                      }
                    />
                    {u.name} <span className="text-xs text-muted-foreground">· {u.area}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="rounded-xl bg-primary-soft p-4 text-sm">
              <p className="label-caps">Visibilidade em tempo real</p>
              <p className="mt-2">
                {eligible.length} pessoa(s) enxergam este programa: {eligible.map((u) => u.name).join(", ")}
              </p>
            </div>
          </section>

          <section>
            <h2 className="mb-4">Funil de avaliação</h2>
            {isAdmin ? (
              <FunnelBuilder programId={program.id} />
            ) : (
              <ol className="space-y-2">
                {program.funnel.stages.map((s, idx) => (
                  <li key={s.id} className="rounded-xl border bg-card p-4 text-sm">
                    <span className="font-medium">
                      {idx + 1}. {s.name}
                    </span>
                    <span className="ml-2 text-muted-foreground">
                      {mechanismLabel[s.mechanism]} · {s.defaultDays} dia(s)
                    </span>
                  </li>
                ))}
                {program.funnel.stages.length === 0 && (
                  <li className="text-sm text-muted-foreground">Funil ainda não configurado.</li>
                )}
              </ol>
            )}
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}
