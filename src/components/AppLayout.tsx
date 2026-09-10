import { Link, useRouterState, type LinkProps } from "@tanstack/react-router";
import type { ReactNode } from "react";
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
  exact?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function AppLayout({ children }: { children: ReactNode }) {
  const { users, viewAsId, setViewAs, caps, role } = useApp();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const sections: NavSection[] = [];
  if (caps.participar)
    sections.push({ title: "Participar", items: [{ to: "/explorar", label: "Desafios abertos" }] });
  if (caps.avaliar)
    sections.push({ title: "Avaliar", items: [{ to: "/avaliacoes", label: "Minhas avaliações" }] });
  if (caps.gerenciar)
    sections.push({
      title: "Gerenciar",
      items: [
        { to: "/", label: "Visão geral", exact: true },
        { to: "/programas", label: "Programas" },
        { to: "/desafios", label: "Desafios" },
      ],
    });
  if (caps.configurar)
    sections.push({
      title: "Configurar",
      items: [{ to: "/objetivos", label: "Objetivos estratégicos" }],
    });

  const roleLabel: Record<string, string> = {
    admin: "Administrador",
    gestor: "Gestor da inovação",
    usuario: "Colaborador",
    avaliador: "Avaliador",
    comite: "Comitê",
    sponsor: "Sponsor",
  };

  return (
    <div className="min-h-screen bg-background lg:flex">
      <aside className="border-b bg-card lg:sticky lg:top-0 lg:h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="flex h-16 items-center px-4">
          <Link
            to="/"
            className="rounded-md text-lg font-semibold text-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            Avantti
          </Link>
        </div>
        <nav className="space-y-6 px-4 pb-6">
          {sections.map((s) => (
            <div key={s.title}>
              <p className="label-caps px-2 text-muted-foreground">{s.title}</p>
              <ul className="mt-2 space-y-1">
                {s.items.map((n) => {
                  const path = String(n.to);
                  const active = n.exact ? pathname === path : pathname.startsWith(path);
                  return (
                    <li key={path}>
                      <Link
                        to={path}
                        aria-current={active ? "page" : undefined}
                        className={cn(
                          "block rounded-md px-2 py-2 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                          active
                            ? "bg-primary-soft font-medium text-primary"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground",
                        )}
                      >
                        {n.label}
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
            <p className="text-xs text-muted-foreground">{roleLabel[role]}</p>
          </div>
          <Select value={viewAsId} onValueChange={setViewAs}>
            <SelectTrigger className="w-60" aria-label="Ver como">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {users.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name} · {roleLabel[u.role]}
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
