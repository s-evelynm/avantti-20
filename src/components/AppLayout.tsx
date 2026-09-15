import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
import {
  Target,
  Lightbulb,
  ClipboardCheck,
  LayoutGrid,
  Building2,
  Flag,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NavItem {
  to: LinkProps["to"];
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { users, viewAsId, setViewAs, caps, ideas, challenges, currentUser, funnelOfChallenge } =
    useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const pendentes = ideas.filter((idea) => {
    if (!idea.currentStageId) return false;
    const challenge = challenges.find((c) => c.id === idea.challengeId);
    if (!challenge) return false;
    const stage = funnelOfChallenge(idea.challengeId).stages.find((s) => s.id === idea.currentStageId);
    if (!stage) return false;
    if (!(idea.assignments[stage.id] ?? []).includes(currentUser.id)) return false;
    return !idea.evaluations.some((e) => e.stageId === stage.id && e.evaluatorId === currentUser.id);
  }).length;

  const sections: NavSection[] = [];
  // Participar aparece para todo mundo: não depende de capacidade.
  sections.push({
    title: "Participar",
    items: [
      { to: "/explorar", label: "Desafios", icon: Target },
      { to: "/minhas-ideias", label: "Minhas ideias", icon: Lightbulb },
    ],
  });
  if (caps.avaliar)
    sections.push({
      title: "Avaliar",
      items: [
        {
          to: "/avaliacoes",
          label: "Minhas avaliações",
          icon: ClipboardCheck,
          ...(pendentes > 0 ? { badge: pendentes } : {}),
        },
      ],
    });
  if (caps.gerenciar)
    sections.push({
      title: "Acompanhar",
      items: [{ to: "/painel", label: "Painel", icon: LayoutGrid }],
    });
  const configItems: NavItem[] = [];
  if (caps.configurarProgramas || caps.configurarDesafios || caps.configurarFunil)
    configItems.push({ to: "/programas", label: "Programas", icon: Building2 });
  if (caps.gerenciarObjetivos)
    configItems.push({ to: "/objetivos", label: "Objetivos estratégicos", icon: Flag });
  if (caps.gerenciarUsuarios)
    configItems.push({ to: "/usuarios", label: "Usuários e permissões", icon: Users });
  if (configItems.length > 0) sections.push({ title: "Configurar", items: configItems });

  const capsSummary = (count: number) =>
    count === 0 ? "Sem capacidades" : `${count} capacidade${count > 1 ? "s" : ""}`;
  const viewer = users.find((u) => u.id === viewAsId);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center px-6">
          <Link
            to="/"
            className="rounded-md text-lg font-semibold text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Avantti
          </Link>
        </div>
        <nav className="space-y-6 px-3 pb-6">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="label-caps px-3 text-muted-foreground">{s.title}</p>
              <ul className="mt-2 space-y-1">
                {s.items.map((n) => {
                  const path = String(n.to);
                  const active = n.exact ? pathname === path : pathname.startsWith(path);
                  const Icon = n.icon;
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          active
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        <span className="truncate">{n.label}</span>
                        {n.badge ? (
                          <span className="ml-auto rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary">
                            {n.badge}
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="flex flex-wrap items-center justify-end gap-3 border-b bg-card px-6 py-3">
          <div className="text-right">
            <p className="label-caps text-muted-foreground">Ver como</p>
            <p className="text-xs text-muted-foreground">
              {capsSummary(viewer?.capabilities.length ?? 0)}
            </p>
          </div>
          <Select value={viewAsId} onValueChange={setViewAs}>
            <SelectTrigger className="w-60" aria-label="Ver como">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {capsSummary(u.capabilities.length)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </header>
        <main className="mx-auto max-w-5xl px-6 py-8">{children}</main>
      </div>
    </div>
  );
}

/** Trilha de navegação: cada nível é clicável e volta àquele ponto. */
export function Breadcrumbs({ children }: { children: ReactNode }) {
  return (
    <nav aria-label="Trilha de navegação" className="mb-4 flex flex-wrap items-center gap-2 text-sm">
      {children}
    </nav>
  );
}

export function CrumbSeparator() {
  return <span className="text-muted-foreground">/</span>;
}

export function CurrentCrumb({ label }: { label: string }) {
  return (
    <span aria-current="page" className="max-w-xs truncate font-medium text-foreground">
      {label}
    </span>
  );
}

export const crumbLinkClass =
  "rounded-sm text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-primary">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}
