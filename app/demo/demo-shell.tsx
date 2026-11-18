"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { DEMO_BASE, DEMO_CLIENT } from "@/lib/plataforma/demo/fixtures";
import { dateBR } from "@/lib/plataforma/demo/format";
import { useDemo } from "./demo-provider";

const clientNav = [
  { href: "/demo/cliente", label: "Visão geral", symbol: "◫" },
  { href: "/demo/cliente/novo", label: "Novo pedido", symbol: "+" },
  { href: "/demo/cliente/historico", label: "Histórico", symbol: "▤" },
];
const operationNav = [
  { href: "/demo/operacao", label: "Visão do ciclo", symbol: "◫" },
  { href: "/demo/operacao/fila", label: "Fila de pedidos", symbol: "▤" },
  { href: "/demo/operacao/devolutivas", label: "Devolutivas", symbol: "↗" },
  { href: "/demo/operacao/externo", label: "Marcos externos", symbol: "◎" },
  { href: "/demo/operacao/relatorios", label: "Relatórios", symbol: "▥" },
  { href: "/demo/operacao/administracao", label: "Administração", symbol: "⚙" },
];

export function DemoShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { gateway, scenario, setScenario } = useDemo();
  const cycle = gateway.getCycle();
  const area = pathname.startsWith("/demo/operacao")
    ? "operation"
    : pathname.startsWith("/demo/cliente")
      ? "client"
      : "home";
  const nav = area === "operation" ? operationNav : clientNav;
  return (
    <div className="demo-shell">
      <header className="demo-topbar">
        <div className="demo-topbar-inner">
          <Link
            href="/demo"
            className="demo-brand"
            aria-label="Enpulse Energia, demonstração"
          >
            <span className="demo-brand-icon" aria-hidden="true">
              <svg viewBox="0 0 48 48" fill="none">
                <path
                  d="M24 6v19"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
                <path
                  d="M14.2 11.5a17.5 17.5 0 1 0 19.6 0"
                  stroke="currentColor"
                  strokeWidth="5.5"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span>
              <strong>enpulse</strong>
              <small>energia que pulsa</small>
            </span>
          </Link>
          <span className="demo-topbar-divider" />
          <span className="demo-app-name">
            Plataforma de bombeio <span className="demo-version">VISÃO 01</span>
          </span>
          <div className="demo-topbar-actions">
            <span className="demo-base-pill">● {DEMO_BASE}</span>
            <Link href="/demo" className="demo-top-link">
              Trocar portal
            </Link>
          </div>
        </div>
      </header>
      <div className="demo-ribbon" role="status">
        <strong>DEMONSTRAÇÃO</strong>
        <span>
          Dados fictícios · nenhuma ação envia pedidos ou mensagens reais
        </span>
        <span className="demo-ribbon-date">
          Ciclo simulado: {dateBR(cycle.submissionDate)}
        </span>
      </div>
      {area === "home" ? (
        <main className="demo-home-main">{children}</main>
      ) : (
        <div className="demo-workspace">
          <aside className="demo-sidebar">
            <div className="demo-sidebar-caption">
              {area === "client" ? "ÁREA DO CLIENTE" : "CENTRAL DE OPERAÇÕES"}
            </div>
            <nav
              aria-label={
                area === "client"
                  ? "Navegação do cliente"
                  : "Navegação da operação"
              }
            >
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`demo-nav-link ${pathname === item.href || (item.href.endsWith("/fila") && pathname.includes("/pedidos/")) ? "active" : ""}`}
                >
                  <span aria-hidden="true">{item.symbol}</span>
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="demo-sidebar-bottom">
              <div className="demo-avatar">
                {area === "client" ? "MC" : "EP"}
              </div>
              <div>
                <strong>
                  {area === "client" ? DEMO_CLIENT.user : "Equipe Enpulse"}
                </strong>
                <small>
                  {area === "client"
                    ? DEMO_CLIENT.name
                    : "Analista · perfil simulado"}
                </small>
              </div>
            </div>
          </aside>
          <div className="demo-main-wrap">
            <div className="demo-toolbar">
              <div>
                <span className="demo-toolbar-label">CENÁRIO DE VALIDAÇÃO</span>
                <strong>
                  {scenario === "weekday"
                    ? "Dia útil"
                    : scenario === "friday"
                      ? "Programação de sexta"
                      : "Janela encerrada"}
                </strong>
              </div>
              <label className="demo-scenario-select">
                Alterar cenário
                <select
                  value={scenario}
                  onChange={(event) =>
                    setScenario(event.target.value as typeof scenario)
                  }
                  aria-label="Selecionar cenário de demonstração"
                >
                  <option value="weekday">Dia útil · 19 nov</option>
                  <option value="friday">Sexta · 20 nov</option>
                  <option value="closed">Janela encerrada</option>
                </select>
              </label>
            </div>
            <main className="demo-main">{children}</main>
            <footer className="demo-footer">
              Enpulse Energia · Protótipo para validação de processo · Horários
              de Brasília
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
