import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import {
  Target,
  Lightbulb,
  ClipboardCheck,
  LayoutGrid,
  Building2,
  Flag,
  Users,
  Menu,
  Info,
  type LucideIcon,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { capabilityLabel } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
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
  /** vazio quando a seção tem um item só e não precisa de agrupamento */
  title: string;
  items: NavItem[];
}

function useNavSections() {
  const { caps, ideas, challenges, currentUser, funnelOfChallenge } = useApp();

  const pendentes = ideas.filter((idea) => {
    if (!idea.currentStageId) return false;
    const challenge = challenges.find((c) => c.id === idea.challengeId);
    if (!challenge) return false;
    const stage = funnelOfChallenge(idea.challengeId).stages.find(
      (s) => s.id === idea.currentStageId,
    );
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
  // Com um item só, o agrupamento "Configurar" não ajuda ninguém.
  if (configItems.length > 0)
    sections.push({ title: configItems.length === 1 ? "" : "Configurar", items: configItems });

  return sections;
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const sections = useNavSections();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <nav className="space-y-6 px-3 pb-6">
      {sections.map((s, index) => (
        <div key={s.title || `secao-${index}`}>
          {s.title && <p className="label-caps px-3 text-muted-foreground">{s.title}</p>}
          <ul className={cn("space-y-1", s.title && "mt-2")}>
            {s.items.map((n) => {
              const path = String(n.to);
              const active = n.exact ? pathname === path : pathname.startsWith(path);
              const Icon = n.icon;
              return (
                <li key={path}>
                  <Link
                    to={path}
                    onClick={onNavigate}
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
  );
}

function ViewAsBlock() {
  const { users, viewAsId, setViewAs } = useApp();
  const viewer = users.find((u) => u.id === viewAsId);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="text-right">
        <p className="label-caps text-muted-foreground">Você está vendo como</p>
        <p className="text-xs text-muted-foreground">
          Trocar de pessoa muda o menu e as telas disponíveis.
        </p>
      </div>
      <Select value={viewAsId} onValueChange={setViewAs}>
        <SelectTrigger className="w-56" aria-label="Escolher a pessoa que você está vendo como">
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
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            O que essa pessoa pode fazer
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="w-80">
          <p className="text-sm font-medium">{viewer?.name}</p>
          <p className="text-xs text-muted-foreground">{viewer?.area}</p>
          {viewer && viewer.capabilities.length > 0 ? (
            <ul className="mt-3 space-y-1 text-sm">
              {viewer.capabilities.map((c) => (
                <li key={c} className="text-muted-foreground">
                  {capabilityLabel[c]}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              Nenhuma capacidade habilitada. Mesmo assim ela vê os desafios, envia ideias e
              acompanha as próprias ideias.
            </p>
          )}
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function AppLayout({ children }: { children: ReactNode }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="hidden bg-card lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:shrink-0 lg:border-r">
        <div className="flex h-16 items-center px-6">
          <Link
            to="/"
            className="rounded-md text-lg font-semibold text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Avantti
          </Link>
        </div>
        <SidebarNav />
      </aside>

      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 border-b bg-info-bg px-6 py-2 text-xs text-info">
          <Info className="size-3.5 shrink-0" aria-hidden />
          Versão de demonstração: os dados são fictícios e nada do que você fizer aqui é salvo.
        </p>
        <header className="flex flex-wrap items-center gap-3 border-b bg-card px-4 py-3 lg:justify-end lg:px-6">
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Abrir menu">
                <Menu className="size-4" aria-hidden />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0">
              <SheetTitle className="px-6 py-4 text-lg font-semibold text-primary">
                Avantti
              </SheetTitle>
              <SidebarNav onNavigate={() => setMenuOpen(false)} />
            </SheetContent>
          </Sheet>
          <Link
            to="/"
            className="text-lg font-semibold text-primary lg:hidden"
            aria-label="Início"
          >
            Avantti
          </Link>
          <div className="ml-auto lg:ml-0">
            <ViewAsBlock />
          </div>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8 lg:px-6">{children}</main>
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
