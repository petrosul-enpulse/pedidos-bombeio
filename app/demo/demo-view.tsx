"use client";

import Link from "next/link";
import { useDemo } from "./demo-provider";
import {
  ClientHome,
  ClientHistory,
  ClientOrderDetail,
  NewOrder,
} from "./client-views";
import {
  Administration,
  AnalysisDesk,
  Communications,
  ExternalTracking,
  OperationHome,
  OrderQueue,
  Reports,
} from "./operation-views";

export function DemoView({ segments }: { segments: string[] }) {
  const { scenario } = useDemo();
  if (segments.length === 0)
    return (
      <div className="demo-portal-choice">
        <div className="demo-portal-intro">
          <span className="demo-eyebrow">
            PLATAFORMA ENPULSE · CONCEITO DE PRODUTO
          </span>
          <h1>Uma operação clara, do pedido à decisão.</h1>
          <p>
            Explore as jornadas do cliente e da equipe Enpulse com dados
            fictícios. Alterne os cenários de dia útil, sexta-feira e janela
            encerrada dentro de cada portal.
          </p>
          <div className="demo-intro-rule" />
        </div>
        <div className="demo-portal-grid">
          <Link href="/demo/cliente" className="demo-portal-card">
            <span className="demo-portal-icon">↗</span>
            <span className="demo-eyebrow">01 / DISTRIBUIDORA</span>
            <h2>Portal do cliente</h2>
            <p>
              Solicite volumes para as datas atendidas, acompanhe o protocolo e
              veja o retorno da Enpulse.
            </p>
            <strong>Explorar jornada →</strong>
          </Link>
          <Link href="/demo/operacao" className="demo-portal-card">
            <span className="demo-portal-icon">▥</span>
            <span className="demo-eyebrow">02 / EQUIPE ENPULSE</span>
            <h2>Central de operações</h2>
            <p>
              Compare pedidos, dados de estoque e decisões; acompanhe
              devolutivas e prazos externos.
            </p>
            <strong>Explorar jornada →</strong>
          </Link>
        </div>
        <p className="demo-home-footnote">
          Protótipo navegável · sem autenticação ou integração real · horário de
          Brasília
        </p>
      </div>
    );
  if (segments[0] === "cliente") {
    if (segments[1] === "novo") return <NewOrder key={scenario} />;
    if (segments[1] === "historico") return <ClientHistory />;
    if (segments[1] === "pedidos" && segments[2])
      return <ClientOrderDetail id={segments[2]} />;
    if (segments.length === 1) return <ClientHome />;
  }
  if (segments[0] === "operacao") {
    if (segments[1] === "fila") return <OrderQueue />;
    if (segments[1] === "pedidos" && segments[2])
      return <AnalysisDesk key={segments[2]} id={segments[2]} />;
    if (segments[1] === "devolutivas") return <Communications />;
    if (segments[1] === "externo") return <ExternalTracking />;
    if (segments[1] === "relatorios") return <Reports />;
    if (segments[1] === "administracao") return <Administration />;
    if (segments.length === 1) return <OperationHome />;
  }
  return (
    <div className="demo-empty">
      <h1>Página não encontrada</h1>
      <p>Esta rota não faz parte da demonstração.</p>
      <Link className="demo-btn demo-btn-primary" href="/demo">
        Voltar ao início
      </Link>
    </div>
  );
}
