import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpRight, ImageIcon } from "lucide-react";
import { PageHeader } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp, formatDate } from "@/lib/store";

export const Route = createFileRoute("/explorar/")({
  head: () => ({
    meta: [
      { title: "Desafios abertos — Avantti" },
      {
        name: "description",
        content: "Veja os desafios de inovação abertos para o seu público e envie sua ideia.",
      },
      { property: "og:title", content: "Desafios abertos — Avantti" },
      { property: "og:description", content: "Desafios de inovação abertos para submissão de ideias." },
    ],
  }),
  component: Explorar,
});

type Aba = "abertos" | "continuos" | "encerrados";

function diasRestantes(deadline?: string) {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
}

function Explorar() {
  const { challenges, currentUser, visiblePrograms, programs, objectives, ideas } = useApp();
  const [aba, setAba] = useState<Aba>("abertos");
  const [somenteMinhas, setSomenteMinhas] = useState(false);

  const visibleIds = visiblePrograms(currentUser.id).map((p) => p.id);
  const participandoIds = useMemo(
    () => new Set(ideas.filter((i) => i.authorId === currentUser.id).map((i) => i.challengeId)),
    [ideas, currentUser.id],
  );

  const base = challenges.filter(
    (c) => c.status !== "rascunho" && visibleIds.includes(c.programId),
  );

  const list = base
    .filter((c) => {
      if (aba === "abertos") return c.status === "aberto" && c.kind === "pontual";
      if (aba === "continuos") return c.kind === "continuo" && c.status !== "encerrado";
      return c.status === "encerrado";
    })
    .filter((c) => (somenteMinhas ? participandoIds.has(c.id) : true));

  return (
    <div>
      <PageHeader
        title="Desafios"
        description="Você enxerga apenas os desafios dos programas em que seu perfil é público elegível."
      />

      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 border-b">
        <Tabs value={aba} onValueChange={(v) => setAba(v as Aba)}>
          <TabsList className="h-auto bg-transparent p-0">
            {(
              [
                ["abertos", "Abertos"],
                ["continuos", "Contínuos"],
                ["encerrados", "Encerrados"],
              ] as const
            ).map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-none transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <label className="flex cursor-pointer items-center gap-2 pb-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <Checkbox
            checked={somenteMinhas}
            onCheckedChange={(v) => setSomenteMinhas(v === true)}
            aria-label="Só os que estou participando"
          />
          Só os que estou participando
        </label>
      </div>

      <ul className="grid gap-6 lg:grid-cols-2">
        {list.map((c) => {
          const dias = diasRestantes(c.deadline);
          const participando = participandoIds.has(c.id);
          const tags = c.objectiveIds
            .map((id) => objectives.find((o) => o.id === id)?.name)
            .filter(Boolean) as string[];

          return (
            <li key={c.id} className="overflow-hidden rounded-xl border bg-card transition-shadow hover:shadow-md">
              <div className="flex h-40 items-center justify-center bg-muted">
                {c.coverUrl ? (
                  <img
                    src={c.coverUrl}
                    alt={`Capa do desafio ${c.title}`}
                    loading="lazy"
                    width={1024}
                    height={512}
                    className="h-40 w-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-8 text-muted-foreground" aria-hidden />
                )}
              </div>

              <div className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-foreground">{c.title}</h3>
                      {participando && (
                        <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-medium text-primary">
                          Participando
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {programs.find((p) => p.id === c.programId)?.name}
                    </p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {c.kind === "continuo"
                      ? "Fluxo contínuo"
                      : dias === null
                        ? ""
                        : dias > 0
                          ? `Faltam ${dias} dias`
                          : dias === 0
                            ? "Último dia"
                            : `Encerrado em ${formatDate(c.deadline)}`}
                  </p>
                </div>

                <p className="mt-3 line-clamp-2 text-sm text-foreground/80">{c.context}</p>

                <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {tags.map((t) => (
                      <span key={t} className="text-xs text-muted-foreground">
                        {t}
                      </span>
                    ))}
                  </div>
                  <Button asChild size="sm">
                    <Link to="/explorar/$challengeId" params={{ challengeId: c.id }}>
                      Ver desafio
                      <ArrowUpRight className="size-4" aria-hidden />
                    </Link>
                  </Button>
                </div>
              </div>
            </li>
          );
        })}

        {list.length === 0 && (
          <li className="rounded-xl border border-dashed bg-card p-8 text-center text-sm text-muted-foreground lg:col-span-2">
            Nenhum desafio nesta aba para o seu perfil no momento.
          </li>
        )}
      </ul>
    </div>
  );
}
