import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useApp } from "@/lib/store";
import {
  CONFIG_CAPABILITIES,
  PROCESS_CAPABILITIES,
  capabilityHint,
  capabilityLabel,
  challengeRoleRequirement,
} from "@/lib/permissions";
import type { Capability } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/usuarios")({
  head: () => ({
    meta: [
      { title: "Usuários e permissões — Avantti" },
      {
        name: "description",
        content:
          "Gestão de usuários por capacidades individuais: configuração, processo e atribuições ativas em desafios.",
      },
      { property: "og:title", content: "Usuários e permissões — Avantti" },
      {
        property: "og:description",
        content: "Ligue capacidades uma a uma por pessoa, sem papéis fixos.",
      },
    ],
  }),
  component: UsuariosPage,
});

function UsuariosPage() {
  const { users, caps, updateUserCapabilities, challenges } = useApp();
  const [selectedId, setSelectedId] = useState(users[0]?.id ?? "");

  if (!caps.gerenciarUsuarios)
    return (
      <div>
        <PageHeader title="Usuários e permissões" />
        <p className="rounded-xl border border-dashed bg-card p-6 text-sm text-muted-foreground">
          Você não tem a capacidade "Gerenciar usuários e permissões" habilitada.
        </p>
      </div>
    );

  const user = users.find((u) => u.id === selectedId) ?? users[0]!;

  const toggle = (cap: Capability, on: boolean) => {
    const next = on
      ? [...user.capabilities, cap]
      : user.capabilities.filter((c) => c !== cap);
    updateUserCapabilities(user.id, next);
    toast.success(`${capabilityLabel[cap]} ${on ? "habilitada" : "desabilitada"}`);
  };

  const markAllConfig = () => {
    const next = Array.from(new Set([...user.capabilities, ...CONFIG_CAPABILITIES]));
    updateUserCapabilities(user.id, next);
    toast.success("Todas as capacidades de configuração foram marcadas");
  };

  /** Atribuições ativas: sempre vindas dos desafios, nunca editáveis aqui. */
  const assignments: string[] = [];
  challenges.forEach((c) => {
    const pools = c.evaluatorPools;
    if (c.ownerId === user.id) assignments.push(`Patrocinador do desafio · ${c.title}`);
    if (c.managerId === user.id) assignments.push(`Gestor responsável · ${c.title}`);
    if (pools?.triagem.includes(user.id)) assignments.push(`Avaliador de triagem · ${c.title}`);
    if (pools?.tecnico.includes(user.id)) assignments.push(`Avaliador técnico · ${c.title}`);
    if ((pools?.comite ?? c.committeeIds).includes(user.id)) assignments.push(`Comitê · ${c.title}`);
  });

  return (
    <div>
      <PageHeader
        title="Usuários e permissões"
        description="Cada pessoa tem capacidades independentes, ligadas uma a uma. Não existem papéis fixos."
      />

      <div className="grid gap-6 lg:grid-cols-[16rem_1fr]">
        <ul className="space-y-1" aria-label="Usuários">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => setSelectedId(u.id)}
                aria-current={u.id === user.id ? "true" : undefined}
                className={cn(
                  "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                  u.id === user.id
                    ? "border-primary bg-primary-soft text-primary"
                    : "bg-card hover:bg-muted",
                )}
              >
                <span className="block font-medium">{u.name}</span>
                <span className="block text-xs text-muted-foreground">
                  {u.area} ·{" "}
                  {u.capabilities.length === 0
                    ? "Sem capacidades"
                    : `${u.capabilities.length} capacidade${u.capabilities.length > 1 ? "s" : ""}`}
                </span>
              </button>
            </li>
          ))}
        </ul>

        <div className="space-y-6">
          <section className="rounded-xl border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">Capacidades de configuração</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Permissões de quem constrói e mantém o processo.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={markAllConfig}>
                Marcar tudo (Administrador)
              </Button>
            </div>
            <ul className="mt-4 space-y-3">
              {CONFIG_CAPABILITIES.map((cap) => (
                <li key={cap}>
                  <label className="flex items-start gap-3 text-sm">
                    <Checkbox
                      className="mt-0.5"
                      checked={user.capabilities.includes(cap)}
                      onCheckedChange={(v) => toggle(cap, !!v)}
                    />
                    <span>
                      <span className="font-medium">{capabilityLabel[cap]}</span>
                      {capabilityHint[cap] && (
                        <span className="block text-xs text-muted-foreground">
                          {capabilityHint[cap]}
                        </span>
                      )}
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-base font-semibold">Capacidades de processo</h2>
            <p className="mt-1 rounded-lg bg-info-bg p-3 text-xs text-info">
              Marcar aqui só libera a pessoa a ser atribuída depois. O menu correspondente só mostra
              conteúdo quando ela for de fato atribuída em algum desafio.
            </p>
            <ul className="mt-4 space-y-3">
              {PROCESS_CAPABILITIES.map((cap) => (
                <li key={cap}>
                  <label className="flex items-center gap-3 text-sm">
                    <Checkbox
                      checked={user.capabilities.includes(cap)}
                      onCheckedChange={(v) => toggle(cap, !!v)}
                    />
                    <span className="font-medium">{capabilityLabel[cap]}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border bg-card p-4">
            <h2 className="text-base font-semibold">Onde esta pessoa já atua</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Só para consulta. Para mudar, abra o desafio e vá em “Papéis e atribuições”.
            </p>
            {assignments.length === 0 ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Esta pessoa ainda não foi colocada em nenhum desafio. Abra um desafio e use a aba
                “Papéis e atribuições” para incluí-la.
              </p>
            ) : (
              <ul className="mt-4 space-y-2">
                {assignments.map((a) => (
                  <li key={a} className="rounded-lg border bg-background px-3 py-2 text-sm">
                    {a}
                  </li>
                ))}
              </ul>
            )}
            {assignments.length > 0 && (
              <ul className="mt-4 space-y-1">
                {Object.values(challengeRoleRequirement)
                  .filter(
                    (r, i, arr) =>
                      arr.findIndex((x) => x.capability === r.capability) === i &&
                      !user.capabilities.includes(r.capability),
                  )
                  .map((r) => (
                    <li key={r.capability} className="text-xs text-danger">
                      {user.name} está atribuída em desafios, mas não tem “
                      {capabilityLabel[r.capability]}” habilitada. Marque a capacidade acima se ela
                      precisar dessa função.
                    </li>
                  ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
