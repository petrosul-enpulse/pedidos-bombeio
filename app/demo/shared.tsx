import Link from "next/link";
import type { ReactNode } from "react";
import { dateBR, numberBR, shortDate } from "@/lib/plataforma/demo/format";
import type { Cycle, Order } from "@/lib/plataforma/types";

export function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="demo-heading">
      <div>
        <span className="demo-eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function Metric({
  label,
  value,
  caption,
  tone = "default",
}: {
  label: string;
  value: string | number;
  caption: string;
  tone?: "default" | "green" | "amber";
}) {
  return (
    <div className={`demo-metric demo-metric-${tone}`}>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{caption}</small>
    </div>
  );
}

export function Status({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red";
}) {
  return (
    <span className={`demo-status demo-status-${tone}`}>
      <span aria-hidden="true">●</span>
      {children}
    </span>
  );
}

export function CycleStrip({ cycle }: { cycle: Cycle }) {
  return (
    <div className={`demo-cycle-strip ${cycle.open ? "" : "closed"}`}>
      <div className="demo-cycle-icon" aria-hidden="true">
        ↗
      </div>
      <div>
        <strong>
          {cycle.open
            ? "Janela de pedidos aberta"
            : "Janela de pedidos encerrada"}
        </strong>
        <span>
          Envio em {dateBR(cycle.submissionDate)} · {cycle.opensAt} às{" "}
          {cycle.closesAt} · horário de Brasília
        </span>
      </div>
      <div className="demo-cycle-target">
        <small>DATAS ATENDIDAS</small>
        <strong>{cycle.targets.map(shortDate).join(" · ")}</strong>
      </div>
    </div>
  );
}

export function OrderStatus({ order }: { order: Order }) {
  if (order.status === "decided") return <Status tone="green">Decidido</Status>;
  if (order.status === "review")
    return <Status tone="amber">Em análise</Status>;
  return <Status>Recebido</Status>;
}

export function OrderSummary({ order, href }: { order: Order; href: string }) {
  const requested = order.lines.reduce((sum, line) => sum + line.requested, 0);
  return (
    <Link href={href} className="demo-order-card">
      <div>
        <span className="demo-card-label">
          {order.protocol} · V{order.version}
        </span>
        <h3>{order.clientName}</h3>
        <p>
          {[...new Set(order.lines.map((line) => shortDate(line.date)))].join(
            " · ",
          )}
        </p>
      </div>
      <div className="demo-order-card-end">
        <OrderStatus order={order} />
        <strong>
          {numberBR(requested)} <small>m³</small>
        </strong>
        <span>Ver detalhes →</span>
      </div>
    </Link>
  );
}

export function EmptyState({
  title,
  description,
  href,
  action,
}: {
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="demo-empty">
      <span className="demo-empty-symbol" aria-hidden="true">
        ◎
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {href && action && (
        <Link className="demo-btn demo-btn-primary" href={href}>
          {action} →
        </Link>
      )}
    </div>
  );
}

export function KeyValue({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="demo-key-value">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
