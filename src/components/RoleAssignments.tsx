import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useApp } from "@/lib/store";
import { capabilityLabel, challengeRoleRequirement, has } from "@/lib/permissions";
import type { AppUser, Capability, EvaluatorPools } from "@/lib/types";

const POOL_KEYS = ["triagem", "tecnico", "comite"] as const;
type PoolKey = (typeof POOL_KEYS)[number];

const poolTitle: Record<PoolKey, string> = {
  triagem: "Grupo de triagem",
  tecnico: "Grupo técnico",
  comite: "Comitê",
};

const poolHint: Record<PoolKey, string> = {
  triagem: "Fazem a primeira leitura das ideias que chegam.",
  tecnico: "Analisam viabilidade e esforço com mais profundidade.",
  comite: "Decidem o resultado final das ideias.",
};

export function poolsOf(challenge: {
  evaluatorPools?: EvaluatorPools | undefined;
  evaluatorPoolIds: string[];
  committeeIds: string[];
}): EvaluatorPools {
  return (
    challenge.evaluatorPools ?? {
      triagem: [],
      tecnico: challenge.evaluatorPoolIds,
      comite: challenge.committeeIds,
    }
  );
}

function CapabilityWarning({
  user,
  capability,
  role,
}: {
  user: AppUser;
  capability: Capability;
  role: string;
}) {
  if (has(user, capability)) return null;
  return (
    <span className="inline-flex items-start gap-1 rounded-lg bg-danger-bg px-2 py-1 text-xs text-danger">
      <AlertTriangle className="mt-0.5 size-3 shrink-0" aria-hidden />
      <span>
        {user.name} não tem “{capabilityLabel[capability]}” habilitada. Pode ficar como {role} mesmo
        assim — para liberar, marque a capacidade em Usuários e permissões.
      </span>
    </span>
  );
}

export function RoleAssignments({ challengeId }: { challengeId: string }) {
  const { challenges, users, updateChallenge } = useApp();
  const challenge = challenges.find((c) => c.id === challengeId)!;
  const pools = poolsOf(challenge);

  const savePools = (next: EvaluatorPools, what: string) => {
    updateChallenge(
      challenge.id,
      {
        evaluatorPools: next,
        // mantém a lógica de avaliação existente em sincronia
        evaluatorPoolIds: Array.from(new Set([...next.triagem, ...next.tecnico, ...next.comite])),
        committeeIds: next.comite,
      },
      what,
    );
    toast.success("Atribuições atualizadas");
  };

  const setPerson = (key: "ownerId" | "managerId", value: string, label: string) => {
    updateChallenge(challenge.id, { [key]: value }, `${label} alterado.`);
    toast.success("Atribuições atualizadas");
  };

  const sponsor = users.find((u) => u.id === challenge.ownerId);
  const manager = users.find((u) => u.id === challenge.managerId);

  return (
    <div className="space-y-6">
      <p className="rounded-lg bg-info-bg p-3 text-sm text-info">
        Quem responde por este desafio é definido só aqui. A lista mostra todas as pessoas: se
        alguém não tiver a capacidade necessária, aparece um aviso — a escolha continua permitida.
      </p>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border bg-card p-4">
          <Label className="label-caps">{challengeRoleRequirement.sponsor.label}</Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Responde pelo desafio e pela decisão final.
          </p>
          <Select
            value={challenge.ownerId}
            onValueChange={(v) => setPerson("ownerId", v, "Patrocinador do desafio")}
          >
            <SelectTrigger className="mt-2" aria-label="Patrocinador do desafio">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {sponsor && (
            <p className="mt-2">
              <CapabilityWarning
                user={sponsor}
                capability={challengeRoleRequirement.sponsor.capability}
                role="patrocinador"
              />
            </p>
          )}
        </div>

        <div className="rounded-xl border bg-card p-4">
          <Label className="label-caps">{challengeRoleRequirement.gestor.label}</Label>
          <Select
            value={challenge.managerId ?? ""}
            onValueChange={(v) => setPerson("managerId", v, "Gestor responsável")}
          >
            <SelectTrigger className="mt-2" aria-label="Gestor responsável">
              <SelectValue placeholder="Selecionar pessoa" />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {u.area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {manager && (
            <p className="mt-2">
              <CapabilityWarning
                user={manager}
                capability={challengeRoleRequirement.gestor.capability}
              />
            </p>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {POOL_KEYS.map((key) => {
          const requirement = challengeRoleRequirement[key];
          return (
            <div key={key} className="rounded-xl border bg-card p-4">
              <p className="label-caps">{poolTitle[key]}</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Quem pode ser escalado nesta frente de avaliação.
              </p>
              <ul className="mt-4 space-y-3">
                {users.map((u) => {
                  const checked = pools[key].includes(u.id);
                  return (
                    <li key={u.id}>
                      <label className="flex items-start gap-2 text-sm">
                        <Checkbox
                          className="mt-0.5"
                          checked={checked}
                          onCheckedChange={(v) =>
                            savePools(
                              {
                                ...pools,
                                [key]: v
                                  ? [...pools[key], u.id]
                                  : pools[key].filter((x) => x !== u.id),
                              },
                              `${poolTitle[key]} alterado (${u.name}).`,
                            )
                          }
                        />
                        <span>
                          <span className="block">{u.name}</span>
                          <span className="block text-xs text-muted-foreground">{u.area}</span>
                          {checked && (
                            <span className="mt-1 block">
                              <CapabilityWarning user={u} capability={requirement.capability} />
                            </span>
                          )}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </div>
  );
}
